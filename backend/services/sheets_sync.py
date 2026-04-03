# ============================================================
#  services/sheets_sync.py  — Google Sheets Auto-Sync
#  Every genuine feedback auto-saves to a live Google Sheet.
#  Admin/Principal can view real-time data without logging in.
# ============================================================

import os
import json
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# ── Config from .env ──────────────────────────────────────────
GOOGLE_SHEETS_ENABLED      = os.getenv("GOOGLE_SHEETS_ENABLED", "false").lower() == "true"
GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")   # path to creds JSON
GOOGLE_SHEET_ID             = os.getenv("GOOGLE_SHEET_ID", "")               # your sheet ID
GOOGLE_SHEET_NAME           = os.getenv("GOOGLE_SHEET_NAME", "FeedbackData") # sheet tab name

# Column headers in order
SHEET_HEADERS = [
    "Timestamp", "Date", "Meal Slot", "Meal Type",
    "Student Username", "Mess Name",
    "Food Quality", "Taste", "Hygiene", "Portion", "Staff Behaviour",
    "Comment", "Has Photo", "AI Score", "Is Suspicious",
    "Tokens Earned", "Total Student Tokens",
]


async def sync_feedback_to_sheets(feedback_doc: dict, ai_result: dict, tokens_earned: int, total_tokens: int, mess_name: str = "") -> bool:
    """
    Appends one feedback row to the configured Google Sheet.
    Called after every genuine feedback save.

    Returns True on success, False on any failure (non-blocking).
    """
    if not GOOGLE_SHEETS_ENABLED:
        logger.debug("Google Sheets sync disabled. Set GOOGLE_SHEETS_ENABLED=true in .env")
        return False

    if not GOOGLE_SERVICE_ACCOUNT_JSON or not GOOGLE_SHEET_ID:
        logger.warning("Google Sheets: GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEET_ID not set.")
        return False

    try:
        # Lazy import — only needed if Sheets is enabled
        import gspread
        from google.oauth2.service_account import Credentials

        scopes = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive",
        ]

        creds = Credentials.from_service_account_file(GOOGLE_SERVICE_ACCOUNT_JSON, scopes=scopes)
        gc    = gspread.authorize(creds)
        sh    = gc.open_by_key(GOOGLE_SHEET_ID)

        # Get or create the sheet tab
        try:
            ws = sh.worksheet(GOOGLE_SHEET_NAME)
        except gspread.WorksheetNotFound:
            ws = sh.add_worksheet(title=GOOGLE_SHEET_NAME, rows=1000, cols=len(SHEET_HEADERS))
            ws.append_row(SHEET_HEADERS)  # Write headers on first create

        # Extract answer scores per category
        answers = {a.get("category", ""): a.get("selected_option", "") for a in feedback_doc.get("answers", [])}

        row = [
            feedback_doc.get("timestamp", datetime.utcnow()).strftime("%Y-%m-%d %H:%M:%S"),
            feedback_doc.get("date_str", ""),
            feedback_doc.get("slot", ""),
            feedback_doc.get("meal_type", ""),
            feedback_doc.get("username", ""),
            mess_name or feedback_doc.get("mess_id", ""),
            answers.get("food_quality", ""),
            answers.get("taste", ""),
            answers.get("hygiene", ""),
            answers.get("portion", ""),
            feedback_doc.get("staff_behaviour", ""),
            feedback_doc.get("comment", ""),
            "Yes" if feedback_doc.get("image_url") else "No",
            ai_result.get("score", ""),
            "Yes" if ai_result.get("is_suspicious") else "No",
            tokens_earned,
            total_tokens,
        ]

        ws.append_row(row)
        logger.info(f"Google Sheets: Synced feedback for {feedback_doc.get('username', 'unknown')}")
        return True

    except ImportError:
        logger.error("Google Sheets: gspread not installed. Run: pip install gspread google-auth")
        return False
    except Exception as e:
        logger.error(f"Google Sheets sync error: {e}")
        return False


async def ensure_sheet_headers(ws) -> None:
    """Write header row if the sheet is empty."""
    try:
        first_row = ws.row_values(1)
        if not first_row:
            ws.append_row(SHEET_HEADERS)
    except Exception:
        pass
