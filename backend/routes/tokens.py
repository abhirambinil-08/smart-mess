# ============================================================
#  routes/tokens.py  — Token balance, history, rewards, CRUD
# ============================================================

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from core.database import get_db
from core.security import get_current_user, require_voter, require_admin
from models.schemas import TokenAdjust, RewardRedeem
from services.token_service import get_level_info, REWARDS

router = APIRouter()


# ── Voter: View My Tokens ─────────────────────────────────────

@router.get("/my")
async def get_my_tokens(user: dict = Depends(require_voter)):
    """Voter views their own token balance, level, and next reward."""
    db    = get_db()
    doc   = await db.users.find_one({"_id": ObjectId(user["user_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found.")

    total        = doc.get("total_tokens", 0)
    level_info   = get_level_info(total)
    redeemed     = doc.get("redeemed_milestones", [])

    # List available (not yet redeemed) rewards
    available_rewards = [
        {"milestone": m, "reward": r, "redeemed": m in redeemed}
        for m, r in REWARDS.items()
        if total >= m   # Only show unlocked rewards
    ]

    return {
        "total_tokens":       total,
        "level_info":         level_info,
        "available_rewards":  available_rewards,
        "redeemed_milestones": redeemed,
    }


# ── Voter: Redeem a Reward ────────────────────────────────────

@router.post("/redeem")
async def redeem_reward(data: RewardRedeem, user: dict = Depends(require_voter)):
    """
    Voter redeems a milestone reward (e.g. free snack at 154 tokens).
    Each milestone can only be redeemed once.
    """
    db     = get_db()
    doc    = await db.users.find_one({"_id": ObjectId(user["user_id"])})
    total  = doc.get("total_tokens", 0)
    redeemed = doc.get("redeemed_milestones", [])

    # Check milestone is valid
    if data.milestone not in REWARDS:
        raise HTTPException(status_code=400, detail="Invalid milestone value.")

    # Check user has enough tokens
    if total < data.milestone:
        raise HTTPException(
            status_code=400,
            detail=f"You need {data.milestone} tokens to unlock this reward. You have {total}."
        )

    # Check not already redeemed
    if data.milestone in redeemed:
        raise HTTPException(status_code=400, detail="You've already redeemed this reward.")

    # Mark as redeemed
    await db.users.update_one(
        {"_id": ObjectId(user["user_id"])},
        {"$push": {"redeemed_milestones": data.milestone}},
    )

    # Log the redemption
    await db.redemptions.insert_one({
        "user_id":   user["user_id"],
        "username":  user["username"],
        "milestone": data.milestone,
        "reward":    REWARDS[data.milestone],
        "redeemed_at": datetime.utcnow(),
    })

    return {
        "success": True,
        "message": f"🎉 Reward redeemed: {REWARDS[data.milestone]}",
        "reward":  REWARDS[data.milestone],
    }


# ── Admin: Adjust User Tokens ─────────────────────────────────

@router.post("/adjust", dependencies=[Depends(require_admin)])
async def adjust_tokens(data: TokenAdjust):
    """
    Admin can add or subtract tokens from any user.
    Use positive amount to add, negative to subtract.
    """
    db  = get_db()
    doc = await db.users.find_one({"_id": ObjectId(data.user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found.")

    new_total = max(0, doc.get("total_tokens", 0) + data.amount)

    await db.users.update_one(
        {"_id": ObjectId(data.user_id)},
        {"$set": {"total_tokens": new_total}},
    )

    # Log the admin action
    await db.token_logs.insert_one({
        "user_id":  data.user_id,
        "username": doc["username"],
        "amount":   data.amount,
        "reason":   data.reason,
        "new_total": new_total,
        "logged_at": datetime.utcnow(),
    })

    return {
        "message":   f"Tokens adjusted for {doc['username']}.",
        "adjustment": data.amount,
        "new_total": new_total,
    }


# ── Admin: Leaderboard ────────────────────────────────────────

@router.get("/leaderboard")
async def get_leaderboard(user: dict = Depends(get_current_user)):
    """Token leaderboard — visible to all authenticated users."""
    db = get_db()
    users = []
    async for u in db.users.find(
        {"role": "voter", "is_active": True},
        {"username": 1, "full_name": 1, "total_tokens": 1},
    ).sort("total_tokens", -1).limit(20):
        tokens     = u.get("total_tokens", 0)
        level_info = get_level_info(tokens)
        users.append({
            "username":    u["username"],
            "full_name":   u.get("full_name", ""),
            "total_tokens": tokens,
            "level_name":  level_info["level_name"],
        })

    return {"leaderboard": users}


# ── Admin: All Users Token Summary ───────────────────────────

@router.get("/all-users", dependencies=[Depends(require_admin)])
async def all_users_tokens():
    """Admin sees all voters with their token balances."""
    db = get_db()
    users = []
    async for u in db.users.find({"role": "voter"}).sort("total_tokens", -1):
        users.append({
            "user_id":    str(u["_id"]),
            "username":   u["username"],
            "email":      u["email"],
            "full_name":  u.get("full_name", ""),
            "total_tokens": u.get("total_tokens", 0),
            "redeemed":   len(u.get("redeemed_milestones", [])),
            "is_active":  u.get("is_active", True),
        })
    return {"users": users, "total_users": len(users)}


# ── Admin: Students with Fake Feedback Warnings ───────────────

@router.get("/warnings", dependencies=[Depends(require_admin)])
async def get_warned_students():
    """Admin sees all students who have received FeedGuard warnings."""
    db = get_db()
    students = []
    async for u in db.users.find(
        {"role": "voter", "fake_feedback_warnings": {"$gt": 0}}
    ).sort("fake_feedback_warnings", -1):
        students.append({
            "user_id":   str(u["_id"]),
            "username":  u["username"],
            "full_name": u.get("full_name", ""),
            "warnings":  u.get("fake_feedback_warnings", 0),
            "tokens":    u.get("total_tokens", 0),
        })
    return {"warned_students": students, "total": len(students)}
