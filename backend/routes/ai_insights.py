# ============================================================
#  routes/ai_insights.py  — Analytics insights + email reports
# ============================================================

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db
from core.security import require_admin, require_mess_staff_or_admin
from models.schemas import EmailReportRequest
from services.ai_insights import analyse_mess, send_email_report

router = APIRouter()


@router.get("")
async def get_insights(user: dict = Depends(require_mess_staff_or_admin)):
    """
    AI-generated insights for each mess location.
    Read-only for mess staff, full access for admin.
    """
    db = get_db()

    # Get all mess locations
    mess_list = []
    async for m in db.mess.find():
        mess_list.append({"id": str(m["_id"]), "name": m["name"]})

    insights = []
    for mess in mess_list:
        # Fetch aggregate stats for this mess
        total = await db.feedback.count_documents({"mess_id": mess["id"]})
        if total == 0:
            insights.append({
                "mess":         mess["name"],
                "status":       "⚪ No Data",
                "recommendation": "No feedback submitted yet.",
                "total_feedback": 0,
                "overall_avg": 0,
            })
            continue

        # Aggregate staff behaviour rating
        pipeline = [
            {"$match":  {"mess_id": mess["id"]}},
            {"$group":  {
                "_id":          None,
                "avg_staff":    {"$avg": "$staff_behaviour"},
                "total_count":  {"$sum": 1},
            }}
        ]
        agg = None
        async for row in db.feedback.aggregate(pipeline):
            agg = row

        stats = {
            "total_feedback": total,
            "avg_hygiene":    agg.get("avg_staff", 3) if agg else 3,
            "avg_taste":      3.0,
            "avg_quality":    3.0,
            "overall_avg":    agg.get("avg_staff", 3) if agg else 3,
        }

        insights.append(analyse_mess(mess["name"], stats))

    return {
        "insights":     insights,
        "generated_at": datetime.utcnow().isoformat(),
        "total_mess":   len(mess_list),
    }


@router.post("/send-report", dependencies=[Depends(require_admin)])
async def send_report(data: EmailReportRequest):
    """
    Admin triggers an analytics email report.
    Supports: weekly, monthly, yearly
    Supports: multiple email recipients
    """
    db = get_db()

    # Re-use the same insights logic
    mess_list = []
    async for m in db.mess.find():
        mess_list.append({"id": str(m["_id"]), "name": m["name"]})

    insights = []
    for mess in mess_list:
        total = await db.feedback.count_documents({"mess_id": mess["id"]})
        stats = {"total_feedback": total, "avg_hygiene": 3.0,
                 "avg_taste": 3.0, "avg_quality": 3.0, "overall_avg": 3.0}
        if total > 0:
            insights.append(analyse_mess(mess["name"], stats))

    if not insights:
        raise HTTPException(status_code=400, detail="No data to report. Submit some feedback first.")

    result = send_email_report(
        recipients=data.recipients,
        insights=insights,
        frequency=data.frequency,
        period_label=data.period_label or datetime.utcnow().strftime("%B %Y"),
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Email sending failed."))

    return {
        "message":   f"Report sent to {len(result['sent_to'])} recipient(s).",
        "sent_to":   result["sent_to"],
        "failed":    result.get("failed", []),
    }
