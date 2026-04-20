# ============================================================
#  services/ai_insights.py  — Analytics, insights, email reports
# ============================================================

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import asyncio
import json
from dotenv import load_dotenv

import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-3-flash-preview')
except Exception:
    model = None


# ── Hygiene Analysis ──────────────────────────────────────────

async def analyse_with_gemini(mess: str, stats: dict, comments: list[str]) -> dict:
    hygiene  = stats.get("avg_hygiene",  0)
    taste    = stats.get("avg_taste",    0)
    quality  = stats.get("avg_quality",  0)
    staff    = stats.get("avg_staff",    0)
    overall  = stats.get("overall_avg",  0)
    count    = stats.get("total_feedback", 0)

    comments_text = "\n".join(f"- {c}" for c in comments) if comments else "No student comments provided."

    if not model or count == 0:
        return {
            "mess": mess,
            "overall_avg": round(overall, 2),
            "hygiene_score": round(hygiene, 2),
            "taste_score": round(taste, 2),
            "quality_score": round(quality, 2),
            "staff_score": round(staff, 2),
            "total_feedback": count,
            "status": "⚪ No Data",
            "urgency": "low",
            "weakest_area": "N/A",
            "recommendation": "No feedback submitted yet." if count == 0 else "Analysis failed (AI model offline).",
        }

    prompt = f"""
You are an expert AI analyst for a university dining system.
Analyze the following feedback data for "{mess}" and provide a short, actionable recommendation.

Data:
- Total Feedback Count: {count}
- Overall Average: {overall:.2f}/5.0 (Note: rating is somewhat out of 4, but assume standard sentiment)
- Hygiene Score: {hygiene:.2f}/5.0
- Taste Score: {taste:.2f}/5.0
- Food Quality Score: {quality:.2f}/5.0
- Staff Behavior Score: {staff:.2f}/5.0

Recent Student Comments:
{comments_text}

Provide your response as a valid JSON object strictly matching this format without any markdown formatting wrappers (no ```json):
{{
    "status": "(pick one: ✅ Excellent, ⚠️ Needs Improvement, 🚨 Critical)",
    "urgency": "(low, medium, or high)",
    "weakest_area": "(e.g., Hygiene, Taste, Quality, Staff, None)",
    "recommendation": "(Write 1-2 concise sentences merging stats insights and reflecting actual student comments. No generic tips, refer to the comments if any exist.)"
}}
"""
    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        text = text.strip()
            
        data = json.loads(text)
        
        return {
            "mess": mess,
            "overall_avg": round(overall, 2),
            "hygiene_score": round(hygiene, 2),
            "taste_score": round(taste, 2),
            "quality_score": round(quality, 2),
            "staff_score": round(staff, 2),
            "total_feedback": count,
            "status": data.get("status", "⚠️ Partial Data"),
            "urgency": data.get("urgency", "medium"),
            "weakest_area": data.get("weakest_area", "N/A"),
            "recommendation": data.get("recommendation", "Analysis generated."),
        }
    except Exception as e:
        print(f"Gemini error: {e}")
        return {
            "mess": mess,
            "overall_avg": round(overall, 2),
            "hygiene_score": round(hygiene, 2),
            "taste_score": round(taste, 2),
            "quality_score": round(quality, 2),
            "staff_score": round(staff, 2),
            "total_feedback": count,
            "status": "⚠️ Error",
            "urgency": "medium",
            "weakest_area": "N/A",
            "recommendation": "AI analysis failed to complete.",
        }


# ── Email Report Generation ───────────────────────────────────

def build_html_report(insights: list, frequency: str, period_label: str) -> str:
    """Generate a nicely formatted HTML email body from insights data."""

    rows = ""
    for ins in insights:
        color = "#27ae60" if "Excellent" in ins["status"] else (
                "#e67e22" if "Improvement" in ins["status"] else "#e74c3c")
        rows += f"""
        <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600">{ins['mess']}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">{ins['total_feedback']}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">{ins['overall_avg']} ⭐</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">{ins['hygiene_score']}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">
                <span style="color:{color};font-weight:600">{ins['status']}</span><br/>
                <small style="color:#666">{ins['recommendation'][:80]}...</small>
            </td>
        </tr>
        """

    return f"""
    <html><body style="font-family:Arial,sans-serif;max-width:700px;margin:auto;color:#333">
    <div style="background:linear-gradient(135deg,#1A56A0,#1ABC9C);padding:30px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="color:white;margin:0">🍱 SmartMess Feedback Report</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0">{frequency.capitalize()} Report — {period_label}</p>
    </div>
    <div style="padding:24px;background:#f9f9f9">
        <h2 style="color:#1A56A0">📊 Mess Performance Summary</h2>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
            <thead>
                <tr style="background:#1A56A0;color:white">
                    <th style="padding:12px;text-align:left">Mess</th>
                    <th style="padding:12px">Feedback</th>
                    <th style="padding:12px">Overall</th>
                    <th style="padding:12px">Hygiene</th>
                    <th style="padding:12px;text-align:left">AI Insight</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
        <p style="color:#888;font-size:12px;margin-top:20px;text-align:center">
            Auto-generated by SmartMess AI · {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}
        </p>
    </div>
    </body></html>
    """


def send_email_report(
    recipients: list[str],
    insights: list,
    frequency: str = "weekly",
    period_label: str = ""
) -> dict:
    """
    Send HTML analytics report to one or more email addresses.
    Uses SMTP settings from .env file.
    
    Returns dict with success/failure info.
    """
    smtp_host = os.getenv("SMTP_HOST",     "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER",     "")
    smtp_pass = os.getenv("SMTP_PASS",     "")

    if not smtp_user or not smtp_pass:
        return {"success": False, "error": "SMTP credentials not configured in .env"}

    if not period_label:
        period_label = datetime.utcnow().strftime("%B %Y")

    html_body = build_html_report(insights, frequency, period_label)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🍱 SmartMess {frequency.capitalize()} Report — {period_label}"
    msg["From"]    = smtp_user
    msg["To"]      = ", ".join(recipients)
    msg.attach(MIMEText(html_body, "html"))

    sent_to = []
    failed  = []

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            for recipient in recipients:
                try:
                    server.sendmail(smtp_user, recipient, msg.as_string())
                    sent_to.append(recipient)
                except Exception as e:
                    failed.append({"email": recipient, "error": str(e)})
    except Exception as e:
        return {"success": False, "error": f"SMTP connection failed: {str(e)}"}

    return {
        "success": True,
        "sent_to": sent_to,
        "failed":  failed,
        "total":   len(recipients),
    }
