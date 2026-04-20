# ============================================================
#  core/database.py  — MongoDB connection (Motor async driver)
# ============================================================

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Global references — set when app starts
client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Called on FastAPI startup — opens MongoDB connection."""
    global client, db
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name   = os.getenv("DB_NAME",   "smart_mess_v2")
    client = AsyncIOMotorClient(mongo_url)
    db     = client[db_name]

    # Create useful indexes so queries are fast
    await db.users.create_index("email",    unique=True)
    await db.users.create_index("username", unique=True)
    await db.feedback.create_index([("user_id", 1), ("date_str", 1)])
    await db.feedback.create_index("slot")
    await db.online_sessions.create_index("user_id", unique=True)

    print(f"[OK] Connected to MongoDB: {db_name}")


async def close_db():
    """Called on FastAPI shutdown."""
    global client
    if client:
        client.close()
        print("[OK] MongoDB connection closed")


def get_db():
    """Returns the active database instance — used in every route."""
    return db
