from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routes.quiz import router as quiz_router
from app.routes.content import router as content_router
from app.routes.user import router as user_router
from app.config.db import get_client, get_db

app = FastAPI(title="EduQuest AI - Backend", version="0.1.0")

# Allow local dev and vercel/render frontends later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiz_router, prefix="/api")
app.include_router(content_router, prefix="/api")
app.include_router(user_router, prefix="/api/user")


@app.get("/")
async def root():
    return {"status": "ok", "service": "eduquest-backend"}

@app.get("/health")
async def health():
    """Check MongoDB connection and environment"""
    try:
        # Test MongoDB connection
        client = get_client()
        await client.admin.command('ping')
        db = get_db()
        collections = await db.list_collection_names()
        
        return {
            "status": "healthy",
            "mongodb": "connected",
            "database": os.getenv("MONGO_DB_NAME", "eduquest"),
            "collections": collections,
            "groq_api_configured": bool(os.getenv("GROQ_API_KEY"))
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "mongodb": "disconnected"
        }
