# ============================================================
#  routes/feedback.py  — Feedback submission with FeedGuard AI
#  NEW: AI genuineness check, Google Sheets sync, online tracking,
#       fake-feedback penalty, suspicious feedback dashboard data.
# ============================================================

import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from bson import ObjectId

from core.database import get_db
from core.security import get_current_user, require_voter
from models.schemas import FeedbackCreate, FeedbackResponse, AnswerItem
from services.time_service import (
    get_current_slot, get_today_str,
    get_next_slot_info, MAX_FEEDBACKS_PER_DAY,
)
from services.token_service import award_tokens, get_level_info, check_milestone_reward
from services.feedguard import analyze_feedback_genuineness, apply_fake_feedback_penalty
from services.sheets_sync import sync_feedback_to_sheets

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Submit Feedback ───────────────────────────────────────────

@router.post("", response_model=FeedbackResponse)
async def submit_feedback(data: FeedbackCreate, user: dict = Depends(require_voter)):
    """
    Student submits feedback.
    - Student must be logged in (unique student ID enforced)
    - Must be inside an allowed time slot
    - Max 1 feedback per slot per day
    - FeedGuard AI checks genuineness -> fake = warning + token deduction
    - Genuine feedback -> tokens awarded + Google Sheets sync
    """
    db      = get_db()
    user_id = user["user_id"]

    # 1. Check time window
    current_slot = get_current_slot()
    if not current_slot:
        next_info = get_next_slot_info()
        raise HTTPException(
            status_code=400,
            detail=f"Feedback is only allowed during meal times. {next_info}"
        )

    today = get_today_str()

    # 2. Check max feedbacks per day
    today_count = await db.feedback.count_documents({
        "user_id":  user_id,
        "date_str": today,
    })
    if today_count >= MAX_FEEDBACKS_PER_DAY:
        raise HTTPException(
            status_code=400,
            detail=f"You have reached the maximum of {MAX_FEEDBACKS_PER_DAY} feedbacks for today."
        )

    # 3. Only 1 feedback per slot
    slot_entry = await db.feedback.find_one({
        "user_id":  user_id,
        "date_str": today,
        "slot":     current_slot,
    })
    if slot_entry:
        raise HTTPException(
            status_code=400,
            detail=f"You already submitted feedback for the {current_slot} slot today."
        )

    # 4. FeedGuard AI check
    answers_data = [a.model_dump() for a in data.answers]
    ai_result = await analyze_feedback_genuineness(
        answers         = answers_data,
        comment         = data.comment or "",
        staff_behaviour = data.staff_behaviour or 3,
        meal_type       = data.meal_type,
        has_image       = bool(data.image_url),
    )

    is_suspicious = ai_result.get("is_suspicious", False)
    ai_score      = ai_result.get("score", 75)
    ai_reason     = ai_result.get("reason", "")
    ai_flags      = ai_result.get("flags", [])

    # 5. Save feedback (always — but flag suspicious ones)
    doc = {
        "user_id":         user_id,
        "username":        user["username"],
        "mess_id":         data.mess_id,
        "meal_type":       data.meal_type,
        "slot":            current_slot,
        "date_str":        today,
        "answers":         answers_data,
        "staff_behaviour": data.staff_behaviour,
        "image_url":       data.image_url or "",
        "comment":         data.comment   or "",
        "timestamp":       datetime.utcnow(),
        "ai_score":        ai_score,
        "is_suspicious":   is_suspicious,
        "ai_reason":       ai_reason,
        "ai_flags":        ai_flags,
    }
    result = await db.feedback.insert_one(doc)
    doc["_id"] = result.inserted_id

    user_doc   = await db.users.find_one({"_id": ObjectId(user_id)})
    old_tokens = user_doc.get("total_tokens", 0)

    # 6. Penalty for suspicious feedback
    if is_suspicious:
        penalty    = await apply_fake_feedback_penalty(db, user_id, user["username"])
        new_tokens = penalty.get("new_total_tokens", old_tokens)
        level_info = get_level_info(new_tokens)
        return FeedbackResponse(
            success=True,
            message=(
                f"Warning FeedGuard flagged your feedback as suspicious. "
                f"{penalty.get('tokens_deducted', 0)} tokens deducted. "
                f"Warning #{penalty.get('warnings', 1)} issued. Please give genuine feedback!"
            ),
            tokens_earned=0,
            total_tokens=new_tokens,
            milestone_reward=None,
            level_info=level_info,
        )

    # 7. Award tokens for genuine feedback
    tokens_earned    = award_tokens()
    new_tokens       = old_tokens + tokens_earned
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"total_tokens": tokens_earned}},
    )
    milestone_reward = check_milestone_reward(old_tokens, new_tokens)
    level_info       = get_level_info(new_tokens)

    # 8. Google Sheets auto-sync (non-blocking)
    try:
        mess_doc  = await db.mess.find_one({"_id": ObjectId(data.mess_id)}) if data.mess_id else None
        mess_name = mess_doc.get("name", data.mess_id) if mess_doc else data.mess_id
        await sync_feedback_to_sheets(
            feedback_doc  = doc,
            ai_result     = ai_result,
            tokens_earned = tokens_earned,
            total_tokens  = new_tokens,
            mess_name     = mess_name,
        )
    except Exception:
        pass

    return FeedbackResponse(
        success=True,
        message=f"Feedback submitted! You earned {tokens_earned} token{'s' if tokens_earned > 1 else ''}!",
        tokens_earned=tokens_earned,
        total_tokens=new_tokens,
        milestone_reward=milestone_reward,
        level_info=level_info,
    )


# ── Image Upload ──────────────────────────────────────────────

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(require_voter),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files allowed.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Max 5MB.")

    ext      = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    return {"url": f"/uploads/{filename}", "filename": filename}


# ── My Feedback History ───────────────────────────────────────

@router.get("/my-history")
async def my_feedback_history(user: dict = Depends(require_voter)):
    db = get_db()
    feedbacks = []
    async for f in db.feedback.find({"user_id": user["user_id"]}).sort("timestamp", -1).limit(20):
        feedbacks.append({
            "date_str":      f["date_str"],
            "slot":          f["slot"],
            "meal_type":     f["meal_type"],
            "comment":       f.get("comment", ""),
            "timestamp":     f["timestamp"].isoformat(),
            "ai_score":      f.get("ai_score", None),
            "is_suspicious": f.get("is_suspicious", False),
        })
    return {"feedback_history": feedbacks}


# ── Admin: All Feedback ───────────────────────────────────────

@router.get("/all")
async def get_all_feedback(
    limit: int = 50,
    user: dict = Depends(get_current_user),
):
    if user["role"] not in ("admin", "mess_staff"):
        raise HTTPException(status_code=403, detail="Not authorized.")

    db = get_db()
    feedbacks = []
    async for f in db.feedback.find().sort("timestamp", -1).limit(limit):
        feedbacks.append({
            "id":            str(f["_id"]),
            "username":      f.get("username", "anonymous"),
            "mess_id":       f.get("mess_id", ""),
            "meal_type":     f["meal_type"],
            "slot":          f.get("slot", ""),
            "date_str":      f["date_str"],
            "staff_rating":  f.get("staff_behaviour", 0),
            "comment":       f.get("comment", ""),
            "image_url":     f.get("image_url", ""),
            "timestamp":     f["timestamp"].isoformat(),
            "answer_count":  len(f.get("answers", [])),
            "ai_score":      f.get("ai_score", None),
            "is_suspicious": f.get("is_suspicious", False),
            "ai_reason":     f.get("ai_reason", ""),
            "ai_flags":      f.get("ai_flags", []),
        })
    return {"feedback": feedbacks, "count": len(feedbacks)}


# ── Admin: Suspicious Feedback Dashboard ─────────────────────

@router.get("/suspicious")
async def get_suspicious_feedback(
    limit: int = 100,
    user: dict = Depends(get_current_user),
):
    """All feedback flagged by FeedGuard — for admin accountability view."""
    if user["role"] not in ("admin", "mess_staff"):
        raise HTTPException(status_code=403, detail="Not authorized.")

    db = get_db()
    feedbacks = []
    async for f in db.feedback.find({"is_suspicious": True}).sort("timestamp", -1).limit(limit):
        feedbacks.append({
            "id":        str(f["_id"]),
            "username":  f.get("username", "anonymous"),
            "meal_type": f["meal_type"],
            "date_str":  f["date_str"],
            "slot":      f.get("slot", ""),
            "comment":   f.get("comment", ""),
            "ai_score":  f.get("ai_score", 0),
            "ai_reason": f.get("ai_reason", ""),
            "ai_flags":  f.get("ai_flags", []),
            "timestamp": f["timestamp"].isoformat(),
        })
    return {"suspicious_feedback": feedbacks, "count": len(feedbacks)}
