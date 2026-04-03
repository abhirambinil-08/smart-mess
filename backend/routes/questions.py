# ============================================================
#  routes/questions.py  — Dynamic daily question management
#  Mess staff: add/edit questions
#  Everyone:   read questions for today's form
# ============================================================

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from core.database import get_db
from core.security import get_current_user, require_mess_staff_or_admin
from models.schemas import QuestionCreate
from services.time_service import get_today_str

router = APIRouter()


# ── Default questions (shown when no custom ones exist) ───────
# Rich question types supported:
# "single_select"  — Emoji + text buttons (original MCQ style)
# "emoji_rating"   — Pure emoji tap (no text, quick feel rating)
# "slider"         — 1-10 slider (more granular)
# "multi_select"   — Pick multiple options (e.g. what was bad?)
# "photo_upload"   — Prompt user to attach a photo
# "voice_note"     — Prompt user to record a voice note
QUESTION_TYPES = ["single_select", "emoji_rating", "slider", "multi_select", "photo_upload", "voice_note"]

DEFAULT_QUESTIONS = [
    {
        "question_text":  "How would you rate the food quality today?",
        "category":       "food_quality",
        "meal_type":      "All",
        "question_type":  "emoji_rating",
        "options":        ["Very Bad", "Bad", "Good", "Excellent"],
        "emoji_scale":    ["😡", "😐", "🙂", "😍"],
        "menu_item":      "",
        "is_default":     True,
    },
    {
        "question_text":  "On a scale of 1-10, how was the taste of today's meal?",
        "category":       "taste",
        "meal_type":      "All",
        "question_type":  "slider",
        "options":        ["1","2","3","4","5","6","7","8","9","10"],
        "emoji_scale":    ["😡","😡","😡","😐","😐","😐","🙂","🙂","😍","😍"],
        "menu_item":      "",
        "is_default":     True,
    },
    {
        "question_text":  "How clean was the mess area?",
        "category":       "hygiene",
        "meal_type":      "All",
        "question_type":  "single_select",
        "options":        ["Dirty", "Needs Improvement", "Clean", "Spotless"],
        "emoji_scale":    ["😡", "😐", "🙂", "😍"],
        "menu_item":      "",
        "is_default":     True,
    },
    {
        "question_text":  "What issues did you notice today? (Select all that apply)",
        "category":       "general",
        "meal_type":      "All",
        "question_type":  "multi_select",
        "options":        ["Cold food", "Long queue", "Less quantity", "Poor taste", "Unhygienic", "Rude staff"],
        "emoji_scale":    ["🥶","⏳","😤","🤢","🧹","😠"],
        "menu_item":      "",
        "is_default":     True,
    },
    {
        "question_text":  "Upload a photo of your meal (helps verify feedback authenticity!)",
        "category":       "general",
        "meal_type":      "All",
        "question_type":  "photo_upload",
        "options":        [],
        "emoji_scale":    [],
        "menu_item":      "",
        "is_default":     True,
    },
    {
        "question_text":  "Rate the behaviour of mess staff.",
        "category":       "staff_behaviour",
        "meal_type":      "All",
        "question_type":  "emoji_rating",
        "options":        ["Very Rude", "Unfriendly", "Polite", "Very Helpful"],
        "emoji_scale":    ["😡", "😐", "🙂", "😍"],
        "menu_item":      "",
        "is_default":     True,
    },
]


# ── Get Today's Questions (used by feedback form) ─────────────

@router.get("/today")
async def get_todays_questions(meal_type: str = "All"):
    """
    Returns today's questions for the feedback form.
    Mess staff can add custom questions for specific days/meals.
    Falls back to defaults if no custom ones exist.
    """
    db    = get_db()
    today = get_today_str()

    # Fetch custom questions for today or permanent ones
    query = {
        "$or": [
            {"date_str": today},         # Today-specific
            {"date_str": ""},            # Permanent questions
        ]
    }

    if meal_type != "All":
        query["$and"] = [{"$or": query.pop("$or")},
                         {"$or": [{"meal_type": meal_type}, {"meal_type": "All"}]}]

    custom_questions = []
    async for q in db.questions.find(query).sort("created_at", -1):
        custom_questions.append({
            "id":            str(q["_id"]),
            "question_text": q["question_text"],
            "category":      q["category"],
            "meal_type":     q["meal_type"],
            "question_type": q.get("question_type", "single_select"),
            "options":       q["options"],
            "emoji_scale":   q["emoji_scale"],
            "menu_item":     q.get("menu_item", ""),
            "is_default":    False,
        })

    # Return custom if available, else show defaults
    if custom_questions:
        return {"questions": custom_questions, "source": "custom", "date": today}

    return {"questions": DEFAULT_QUESTIONS, "source": "default", "date": today}


# ── Mess Staff / Admin: Add Question ─────────────────────────

@router.post("", dependencies=[Depends(require_mess_staff_or_admin)])
async def add_question(data: QuestionCreate, user: dict = Depends(require_mess_staff_or_admin)):
    """
    Mess staff or admin can add a new question.
    Can be day-specific (set date_str) or permanent (leave blank).
    """
    db = get_db()

    # Validate emoji scale length matches options length
    if len(data.emoji_scale) != len(data.options):
        raise HTTPException(
            status_code=400,
            detail=f"emoji_scale length ({len(data.emoji_scale)}) must match options length ({len(data.options)})."
        )

    doc = {
        **data.model_dump(),
        "created_by": user["username"],
        "created_at": datetime.utcnow(),
    }
    result = await db.questions.insert_one(doc)

    return {"message": "Question added successfully.", "id": str(result.inserted_id)}


# ── Mess Staff / Admin: Update Question ──────────────────────

@router.put("/{question_id}", dependencies=[Depends(require_mess_staff_or_admin)])
async def update_question(question_id: str, data: QuestionCreate):
    """Update an existing question (mess staff or admin)."""
    db = get_db()

    result = await db.questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": {**data.model_dump(), "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Question not found.")

    return {"message": "Question updated successfully."}


# ── Admin Only: Delete Question ───────────────────────────────

@router.delete("/{question_id}")
async def delete_question(question_id: str, user: dict = Depends(get_current_user)):
    """Only admin can delete questions."""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete questions.")

    db = get_db()
    result = await db.questions.delete_one({"_id": ObjectId(question_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found.")

    return {"message": "Question deleted."}


# ── List All Questions (Admin/Staff) ──────────────────────────

@router.get("/all", dependencies=[Depends(require_mess_staff_or_admin)])
async def list_all_questions():
    """View all questions in the system (admin + mess staff)."""
    db = get_db()
    questions = []
    async for q in db.questions.find().sort("created_at", -1):
        questions.append({
            "id":            str(q["_id"]),
            "question_text": q["question_text"],
            "category":      q["category"],
            "meal_type":     q["meal_type"],
            "options":       q["options"],
            "emoji_scale":   q["emoji_scale"],
            "question_type": q.get("question_type", "single_select"),
            "menu_item":     q.get("menu_item", ""),
            "date_str":      q.get("date_str", ""),
            "created_by":    q.get("created_by", ""),
            "created_at":    q["created_at"].isoformat(),
        })
    return {"questions": questions, "total": len(questions)}
