# ============================================================
#  main.py  — FastAPI entry point
#  Run: uvicorn main:app --reload
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from core.database import connect_db, close_db
from routes import auth, feedback, questions, tokens, dashboard, ai_insights, qr_code, mess_config


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Smart Mess Feedback System v2",
    description="Full-featured QR-based feedback system with roles, tokens, time slots, and AI insights.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

# Register all routers
app.include_router(auth.router,        prefix="/api/auth",       tags=["Auth"])
app.include_router(feedback.router,    prefix="/api/feedback",   tags=["Feedback"])
app.include_router(questions.router,   prefix="/api/questions",  tags=["Questions"])
app.include_router(tokens.router,      prefix="/api/tokens",     tags=["Tokens"])
app.include_router(dashboard.router,   prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(ai_insights.router, prefix="/api/insights",   tags=["AI Insights"])
app.include_router(qr_code.router,     prefix="/api/qr",         tags=["QR Code"])
app.include_router(mess_config.router, prefix="/api/mess",       tags=["Mess Config"])


@app.get("/")
async def root():
    return {"message": "Smart Mess Feedback API v2 is running ✅", "docs": "/docs"}
