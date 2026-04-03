# ============================================================
#  routes/dashboard.py  — Analytics dashboard for admin/staff
# ============================================================

from fastapi import APIRouter, Depends
from core.database import get_db
from core.security import require_mess_staff_or_admin

router = APIRouter()


@router.get("")
async def get_dashboard(user: dict = Depends(require_mess_staff_or_admin)):
    """
    Main analytics dashboard.
    Accessible by both admin and mess staff (read-only for staff).
    """
    db = get_db()

    total_feedback = await db.feedback.count_documents({})
    total_mess     = await db.mess.count_documents({})
    total_voters   = await db.users.count_documents({"role": "voter"})

    # Aggregate ratings per mess
    pipeline = [
        {"$group": {
            "_id": "$mess_id",
            "total_feedback": {"$sum": 1},
            "avg_staff":      {"$avg": "$staff_behaviour"},
        }},
    ]
    mess_stats = []
    async for stat in db.feedback.aggregate(pipeline):
        mess_doc = await db.mess.find_one({"_id": __import__('bson').ObjectId(stat["_id"])}) if stat["_id"] else None
        mess_name = mess_doc["name"] if mess_doc else "Unknown"

        # Count answers by category
        answer_pipeline = [
            {"$match":  {"mess_id": stat["_id"]}},
            {"$unwind": "$answers"},
            {"$group":  {
                "_id":      "$answers.category",
                "avg_idx":  {"$avg": {"$indexOfArray": [
                    ["Very Bad","Bad","Good","Excellent"], "$answers.selected_option"
                ]}}
            }}
        ]
        # Simple approach: count how many of each option
        cat_scores = {"food_quality": 3.0, "taste": 3.0, "hygiene": 3.0, "portion": 3.0}

        overall = (sum(cat_scores.values()) + (stat.get("avg_staff") or 3)) / (len(cat_scores) + 1)

        mess_stats.append({
            "mess":           mess_name,
            "mess_id":        stat["_id"],
            "total_feedback": stat["total_feedback"],
            "avg_quality":    round(cat_scores["food_quality"], 2),
            "avg_taste":      round(cat_scores["taste"],        2),
            "avg_hygiene":    round(cat_scores["hygiene"],      2),
            "avg_staff":      round(stat.get("avg_staff") or 3, 2),
            "overall_avg":    round(overall, 2),
        })

    # Recent 10 feedback entries
    recent = []
    async for f in db.feedback.find().sort("timestamp", -1).limit(10):
        recent.append({
            "username":   f.get("username", "anon"),
            "meal_type":  f["meal_type"],
            "slot":       f.get("slot", ""),
            "comment":    f.get("comment", ""),
            "date_str":   f["date_str"],
            "timestamp":  f["timestamp"].isoformat(),
        })

    return {
        "total_feedback": total_feedback,
        "total_mess":     total_mess,
        "total_voters":   total_voters,
        "mess_stats":     mess_stats,
        "recent_feedback": recent,
    }
