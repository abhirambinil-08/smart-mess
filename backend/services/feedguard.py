# ============================================================
#  services/feedguard.py  — FeedGuard AI: Fake Feedback Detector
#  Uses Claude API to analyze feedback genuineness before saving.
#  Fake/random submissions → warning deducted from student tokens.
# ============================================================

import os
import httpx
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

# Score below this threshold = feedback flagged as suspicious
SUSPICION_THRESHOLD = 40


async def analyze_feedback_genuineness(
    answers: list[dict],
    comment: str,
    staff_behaviour: int,
    meal_type: str,
    has_image: bool,
) -> dict:
    """
    Calls Claude API to score the genuineness of a feedback submission.

    Returns:
        {
            "score": 0-100,        # 100 = clearly genuine, 0 = clearly fake
            "is_suspicious": bool,
            "reason": str,         # Short explanation
            "flags": list[str],    # Specific red flags found
        }
    """
    if not ANTHROPIC_API_KEY:
        # If no API key configured, skip AI check and pass all feedback
        logger.warning("FeedGuard: ANTHROPIC_API_KEY not set. Skipping AI check.")
        return {
            "score": 75,
            "is_suspicious": False,
            "reason": "AI check skipped (API key not configured).",
            "flags": [],
        }

    # Build a readable summary of the answers
    answers_summary = ""
    for i, ans in enumerate(answers, 1):
        answers_summary += f"  Q{i} [{ans.get('category', 'general')}]: {ans.get('question_text', '')} → {ans.get('selected_option', '')} {ans.get('emoji', '')}\n"

    prompt = f"""You are FeedGuard, an AI that detects fake or randomly-submitted mess feedback from college students.

Analyze the following feedback submission and return a JSON response ONLY (no extra text).

=== FEEDBACK SUBMISSION ===
Meal Type: {meal_type}
Staff Behaviour Rating: {staff_behaviour}/4
Has Photo Attached: {has_image}
Comment: "{comment or 'No comment'}"

MCQ Answers:
{answers_summary}

=== YOUR TASK ===
Score the genuineness of this feedback from 0 to 100.
- 100 = clearly genuine (thoughtful, consistent answers, meaningful comment)
- 0 = clearly fake (all same rating, random pattern, no effort)

Red flags to look for:
- All answers rated identically (e.g., all worst or all best)
- Answer pattern is random or inconsistent
- Comment is empty, gibberish, or only 1-2 meaningless characters
- Staff behaviour and food ratings are wildly inconsistent with no comment
- Looks like someone just spam-clicked to earn tokens

Genuine signals:
- Varied ratings that make sense for a real meal experience
- Meaningful comment (even short but relevant)
- Attached photo (strong signal of genuine effort)
- Ratings align logically (e.g., bad food + bad hygiene together)

Respond ONLY with valid JSON in this exact format:
{{
  "score": <integer 0-100>,
  "is_suspicious": <true/false>,
  "reason": "<one sentence explanation>",
  "flags": ["<flag1>", "<flag2>"]
}}"""

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )

        if response.status_code != 200:
            logger.error(f"FeedGuard API error: {response.status_code} {response.text}")
            return _fallback_result()

        data = response.json()
        raw_text = data["content"][0]["text"].strip()

        # Strip markdown fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        result = json.loads(raw_text.strip())

        # Enforce is_suspicious based on score threshold
        result["is_suspicious"] = result.get("score", 100) < SUSPICION_THRESHOLD
        return result

    except json.JSONDecodeError as e:
        logger.error(f"FeedGuard JSON parse error: {e}")
        return _fallback_result()
    except Exception as e:
        logger.error(f"FeedGuard unexpected error: {e}")
        return _fallback_result()


def _fallback_result() -> dict:
    """Return a safe fallback if the AI call fails — don't block feedback."""
    return {
        "score": 60,
        "is_suspicious": False,
        "reason": "AI analysis unavailable. Feedback accepted.",
        "flags": [],
    }


# ── Warning / Token Penalty Logic ─────────────────────────────

WARNING_DEDUCTION = 5   # tokens deducted per fake feedback warning

async def apply_fake_feedback_penalty(db, user_id: str, username: str) -> dict:
    """
    Called when AI flags feedback as suspicious.
    Increments warning count and deducts tokens.
    Returns updated warning info.
    """
    from bson import ObjectId

    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        return {}

    current_warnings = user_doc.get("fake_feedback_warnings", 0) + 1
    current_tokens   = user_doc.get("total_tokens", 0)
    new_tokens       = max(0, current_tokens - WARNING_DEDUCTION)

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "fake_feedback_warnings": current_warnings,
                "total_tokens":           new_tokens,
            }
        },
    )

    # Log the penalty
    from datetime import datetime
    await db.token_logs.insert_one({
        "user_id":    user_id,
        "username":   username,
        "amount":     -WARNING_DEDUCTION,
        "reason":     f"FeedGuard: Suspicious feedback detected (warning #{current_warnings})",
        "new_total":  new_tokens,
        "logged_at":  datetime.utcnow(),
    })

    return {
        "warnings":         current_warnings,
        "tokens_deducted":  WARNING_DEDUCTION,
        "new_total_tokens": new_tokens,
    }
