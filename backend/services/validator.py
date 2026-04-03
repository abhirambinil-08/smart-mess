# ============================================================
#  services/validator.py  — Spam detection & confidence score
# ============================================================

from core.database import get_db
from datetime import datetime, date


def calculate_confidence(interaction_time: float, ratings: list[int]) -> float:
    """
    Score starts at 1.0.
    Penalise if:
      - form filled too fast (bot behaviour)
      - all ratings are the same number (bot pattern)
    """
    score = 1.0

    if interaction_time < 5:
        score -= 0.4   # Very fast → suspicious
    elif interaction_time < 10:
        score -= 0.2   # Somewhat fast → slightly suspicious

    if len(set(ratings)) == 1:
        score -= 0.3   # All ratings identical → likely bot

    # Keep score within [0.1, 1.0]
    return round(max(0.1, min(1.0, score)), 2)


async def is_duplicate(device_fingerprint: str, meal_type: str) -> bool:
    """
    Return True if this device already submitted feedback
    for this meal type today.
    """
    db = get_db()
    today_start = datetime.combine(date.today(), datetime.min.time())

    existing = await db.feedback.find_one({
        "device_fingerprint": device_fingerprint,
        "meal_type": meal_type,
        "timestamp": {"$gte": today_start},
    })
    return existing is not None
