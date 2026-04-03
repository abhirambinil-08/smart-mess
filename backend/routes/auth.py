# ============================================================
#  routes/auth.py  — Login, Register, Mess Staff creation
# ============================================================

import secrets
import string
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId

from core.database import get_db
from core.security import (
    hash_password, verify_password, create_token,
    get_current_user, require_admin,
)
from models.schemas import (
    LoginRequest, LoginResponse, RegisterRequest, CreateStaffRequest,
)

router = APIRouter()


# ── Voter Self-Registration ───────────────────────────────────

@router.post("/register")
async def register_voter(data: RegisterRequest):
    """
    Students (voters) can self-register.
    Role is automatically set to 'voter'.
    """
    db = get_db()

    # Check for duplicates
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered.")
    if await db.users.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already taken.")

    user_doc = {
        "username":      data.username,
        "email":         data.email,
        "password_hash": hash_password(data.password),
        "full_name":     data.full_name,
        "role":          "voter",          # Always voter for self-registration
        "is_active":     True,
        "total_tokens":  0,                # Start with 0 tokens
        "redeemed_milestones": [],         # Track which rewards they've claimed
        "created_at":    datetime.utcnow(),
    }

    result = await db.users.insert_one(user_doc)
    return {"message": f"Account created! Welcome, {data.username}.", "user_id": str(result.inserted_id)}


# ── Universal Login ───────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    """Login for all roles: voter, mess_staff, admin."""
    db = get_db()

    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email not found.")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password.")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact admin.")

    # Update last login time
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    # Mark as online (for admin to see)
    await db.online_sessions.update_one(
        {"user_id": str(user["_id"])},
        {"$set": {"user_id": str(user["_id"]), "role": user["role"],
                  "username": user["username"], "last_seen": datetime.utcnow()}},
        upsert=True,
    )

    token = create_token({
        "user_id":  str(user["_id"]),
        "email":    user["email"],
        "role":     user["role"],
        "username": user["username"],
    })

    return LoginResponse(
        access_token=token,
        user_id=str(user["_id"]),
        email=user["email"],
        role=user["role"],
        username=user["username"],
    )


# ── Logout ────────────────────────────────────────────────────

@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Mark user as offline by removing their session entry."""
    db = get_db()
    await db.online_sessions.delete_one({"user_id": user["user_id"]})
    return {"message": "Logged out successfully."}


# ── Get Current User Info ─────────────────────────────────────

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Returns the current user's profile from the database."""
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(user["user_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "user_id":     str(doc["_id"]),
        "username":    doc["username"],
        "email":       doc["email"],
        "full_name":   doc.get("full_name", ""),
        "role":        doc["role"],
        "total_tokens": doc.get("total_tokens", 0),
        "created_at":  doc["created_at"].isoformat(),
    }


# ── Admin: Create Mess Staff Account ─────────────────────────

@router.post("/create-staff", dependencies=[Depends(require_admin)])
async def create_staff_account(data: CreateStaffRequest):
    """
    Admin creates a mess staff account.
    Returns the generated login email and password for distribution.
    """
    db = get_db()

    if await db.users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Use the provided password (admin sets it)
    staff_doc = {
        "username":      data.email.split("@")[0],  # e.g. "ravi.kumar"
        "email":         data.email,
        "full_name":     data.full_name,
        "password_hash": hash_password(data.password),
        "role":          "mess_staff",
        "department":    data.department,
        "is_active":     True,
        "total_tokens":  0,
        "created_at":    datetime.utcnow(),
    }

    result = await db.users.insert_one(staff_doc)

    return {
        "message":   "Mess staff account created successfully.",
        "staff_id":  str(result.inserted_id),
        "full_name": data.full_name,
        "email":     data.email,
        "password":  data.password,   # Show once — admin must share with staff
        "role":      "mess_staff",
        "note":      "⚠️ Save these credentials and share with staff. Password shown only once.",
    }


# ── Admin: List All Staff ─────────────────────────────────────

@router.get("/staff-list", dependencies=[Depends(require_admin)])
async def list_staff():
    """Admin can view all mess staff accounts."""
    db = get_db()
    staff = []
    async for u in db.users.find({"role": "mess_staff"}).sort("created_at", -1):
        staff.append({
            "user_id":    str(u["_id"]),
            "full_name":  u.get("full_name", ""),
            "email":      u["email"],
            "username":   u["username"],
            "department": u.get("department", ""),
            "is_active":  u.get("is_active", True),
            "created_at": u["created_at"].isoformat(),
        })
    return {"staff": staff}


# ── Admin: First-Time Setup ───────────────────────────────────

@router.post("/setup")
async def create_first_admin(data: LoginRequest):
    """
    One-time route to bootstrap the first admin account.
    Disable this endpoint after first use in production!
    """
    db = get_db()

    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists. This route is disabled.")

    await db.users.insert_one({
        "username":      "admin",
        "email":         data.email,
        "password_hash": hash_password(data.password),
        "full_name":     "System Admin",
        "role":          "admin",
        "is_active":     True,
        "total_tokens":  0,
        "created_at":    datetime.utcnow(),
    })

    return {"message": f"✅ Admin account created for {data.email}. Disable /setup now!"}


# ── Admin: Online Users ───────────────────────────────────────

@router.get("/online-users", dependencies=[Depends(require_admin)])
async def get_online_users():
    """Admin only: see which mess staff / voters are currently logged in."""
    db = get_db()
    sessions = []
    async for s in db.online_sessions.find():
        sessions.append({
            "user_id":   s["user_id"],
            "username":  s.get("username", "unknown"),
            "role":      s.get("role",     "unknown"),
            "last_seen": s["last_seen"].isoformat(),
        })
    return {"online_users": sessions, "count": len(sessions)}


# ── Online Session Tracking ───────────────────────────────────

from datetime import datetime as _dt

@router.post("/heartbeat")
async def heartbeat(user: dict = Depends(get_current_user)):
    """
    Frontend pings this every 60s to mark user as online.
    Admin/staff can query who is currently online.
    """
    db = get_db()
    await db.online_sessions.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {
                "user_id":   user["user_id"],
                "username":  user["username"],
                "role":      user["role"],
                "last_seen": _dt.utcnow(),
            }
        },
        upsert=True,
    )
    return {"ok": True}


@router.get("/online-users")
async def get_online_users(user: dict = Depends(get_current_user)):
    """
    Admin/mess_staff can see who is online right now.
    'Online' = last heartbeat within the past 3 minutes.
    """
    if user["role"] not in ("admin", "mess_staff"):
        raise HTTPException(status_code=403, detail="Not authorized.")

    from datetime import timedelta
    cutoff = _dt.utcnow() - timedelta(minutes=3)
    db = get_db()
    online = []
    async for s in db.online_sessions.find({"last_seen": {"$gte": cutoff}}).sort("last_seen", -1):
        online.append({
            "username":  s["username"],
            "role":      s["role"],
            "last_seen": s["last_seen"].isoformat(),
        })
    return {"online_users": online, "count": len(online)}
@router.post("/heartbeat")
def heartbeat():
    return {"status": "alive"}