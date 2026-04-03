# ============================================================
#  services/time_service.py  — Feedback time-window validation
# ============================================================

from datetime import datetime, time
import pytz

# IST timezone (change to your institution's timezone)
IST = pytz.timezone("Asia/Kolkata")

# ── Allowed time windows ──────────────────────────────────────
# Each slot: (name, start_hour, start_min, end_hour, end_min)
TIME_SLOTS = [
    ("morning",   7,  0,  11, 0),   # 7:00 AM  – 11:00 AM
    ("afternoon", 13, 0,  15, 0),   # 1:00 PM  – 3:00 PM
    ("evening",   19, 0,  22, 0),   # 7:00 PM  – 10:00 PM
]

MAX_FEEDBACKS_PER_DAY = 3   # Max 3 feedbacks per user per day
MAX_PER_SLOT          = 1   # Max 1 feedback per time slot


def get_current_slot() -> str | None:
    """
    Returns the current time slot name (morning/afternoon/evening)
    if we're inside an allowed window. Returns None otherwise.
    """
    now = datetime.now(IST).time()

    for name, sh, sm, eh, em in TIME_SLOTS:
        start = time(sh, sm)
        end   = time(eh, em)
        if start <= now <= end:
            return name

    return None   # Not inside any allowed window


def get_today_str() -> str:
    """Returns today's date as YYYY-MM-DD string (IST)."""
    return datetime.now(IST).strftime("%Y-%m-%d")


def get_slot_label(slot: str) -> str:
    """Returns human-friendly slot times for error messages."""
    labels = {
        "morning":   "7:00 AM – 11:00 AM",
        "afternoon": "1:00 PM – 3:00 PM",
        "evening":   "7:00 PM – 10:00 PM",
    }
    return labels.get(slot, slot)


def get_next_slot_info() -> str:
    """Returns info about the next available feedback window."""
    now = datetime.now(IST).time()
    for name, sh, sm, _, _ in TIME_SLOTS:
        start = time(sh, sm)
        if now < start:
            return f"Next slot: {name.capitalize()} at {start.strftime('%I:%M %p')}"
    return "Next slot: Morning at 7:00 AM (tomorrow)"
