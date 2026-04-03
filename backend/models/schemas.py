# ============================================================
#  models/schemas.py  — All request/response data shapes
#  Using Pydantic v2 (FastAPI 0.100+)
# ============================================================

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class RegisterRequest(BaseModel):
    """Voters self-register."""
    username: str = Field(min_length=3, max_length=30)
    email:    EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = ""

class LoginResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      str
    email:        str
    role:         str
    username:     str

class CreateStaffRequest(BaseModel):
    """Admin creates a mess staff account and generates their credentials."""
    full_name:   str
    email:       EmailStr
    password:    str = Field(min_length=6)
    department:  Optional[str] = "Mess Department"


# ── Questions & Menu ─────────────────────────────────────────

class QuestionCreate(BaseModel):
    """A daily MCQ question for the feedback form."""
    question_text: str
    category:      str          # food_quality / taste / hygiene / staff_behaviour / general
    meal_type:     str          # Breakfast / Lunch / Dinner / All
    options:       List[str]    # MCQ options (usually 4)
    emoji_scale:   List[str]    # Matching emojis e.g. ["😡","😐","🙂","😍"]
    menu_item:     Optional[str] = ""   # e.g. "Dal Makhani" (today's dish)
    date_str:      Optional[str] = ""   # YYYY-MM-DD, blank = permanent question

class QuestionResponse(QuestionCreate):
    id:         str
    created_by: str
    created_at: datetime


# ── Feedback ─────────────────────────────────────────────────

class AnswerItem(BaseModel):
    """One answered question inside a feedback submission."""
    question_id:  str
    question_text: str
    selected_option: str
    emoji:        str
    category:     str

class FeedbackCreate(BaseModel):
    """Data sent when a voter submits feedback."""
    mess_id:          str
    meal_type:        str            # Breakfast / Lunch / Dinner
    answers:          List[AnswerItem]
    staff_behaviour:  Optional[int] = Field(default=3, ge=1, le=4)  # 1-4 emoji rating
    image_url:        Optional[str] = ""      # Optional uploaded image path
    comment:          Optional[str] = Field(default="", max_length=300)

class FeedbackResponse(BaseModel):
    success:           bool
    message:           str
    tokens_earned:     Optional[int]    = None
    total_tokens:      Optional[int]    = None
    milestone_reward:  Optional[str]    = None
    level_info:        Optional[dict]   = None


# ── Tokens ───────────────────────────────────────────────────

class TokenAdjust(BaseModel):
    """Admin can manually adjust a user's token balance."""
    user_id: str
    amount:  int    # positive = add, negative = subtract
    reason:  Optional[str] = "Admin adjustment"

class RewardRedeem(BaseModel):
    """Voter redeems a reward at a milestone."""
    milestone: int   # e.g. 154, 369, 649, 1599, 2999


# ── Mess ─────────────────────────────────────────────────────

class MessCreate(BaseModel):
    name:        str
    institution: str
    location:    Optional[str] = ""

class MessResponse(BaseModel):
    id:          str
    name:        str
    institution: str
    location:    str
    created_at:  datetime


# ── Insights / Email ─────────────────────────────────────────

class EmailReportRequest(BaseModel):
    recipients:    List[EmailStr]
    frequency:     str   # weekly / monthly / yearly
    period_label:  Optional[str] = ""


# ── Dashboard ────────────────────────────────────────────────

class MessStats(BaseModel):
    mess:             str
    total_feedback:   int
    avg_quality:      float
    avg_taste:        float
    avg_hygiene:      float
    avg_staff:        float
    overall_avg:      float

class DashboardResponse(BaseModel):
    total_feedback:   int
    total_mess:       int
    total_voters:     int
    mess_stats:       List[MessStats]
    recent_feedback:  List[dict]
