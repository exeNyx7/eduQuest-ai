"""
Daily Quests API Routes
Handles daily quest data persistence, progress tracking, and daily resets
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from app.config.db import get_db

router = APIRouter()


def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_mongo_doc(value)
            elif isinstance(value, list):
                result[key] = [serialize_mongo_doc(item) if isinstance(item, dict) else item for item in value]
            else:
                result[key] = value
        return result
    return doc

class QuestProgress(BaseModel):
    id: int
    title: str
    description: str
    progress: int
    target: int
    xp: int
    icon: str
    completed: bool

class DailyQuestsData(BaseModel):
    user_id: str
    date: str  # ISO date string for today
    quests: List[QuestProgress]

class UpdateProgressRequest(BaseModel):
    user_id: str
    questId: int
    increment: int = 1


def get_today() -> str:
    """Get today's date in ISO format"""
    return datetime.now().strftime("%Y-%m-%d")


def create_default_daily_quests() -> List[QuestProgress]:
    """Create the default set of daily quests"""
    return [
        QuestProgress(
            id=1,
            title="First Steps",
            description="Complete your first quiz today",
            progress=0,
            target=1,
            xp=20,
            icon="🎯",
            completed=False
        ),
        QuestProgress(
            id=2,
            title="Knowledge Seeker",
            description="Answer 10 questions correctly",
            progress=0,
            target=10,
            xp=50,
            icon="📖",
            completed=False
        ),
        QuestProgress(
            id=3,
            title="Perfectionist",
            description="Achieve a perfect score in a quiz",
            progress=0,
            target=1,
            xp=75,
            icon="⭐",
            completed=False
        )
    ]


@router.get("/daily-quests/{user_id}")
async def get_daily_quests(user_id: str):
    """
    Get or create daily quests for a user.
    Automatically resets if a new day has started.
    """
    try:
        db = get_db()
        collection = db.daily_quests
        
        today = get_today()
        
        # Find existing daily quests for this user
        existing_quests = await collection.find_one({"user_id": user_id})
        
        # If no quests exist or it's a new day, create/reset
        if not existing_quests or existing_quests.get("date") != today:
            new_quests = DailyQuestsData(
                user_id=user_id,
                date=today,
                quests=create_default_daily_quests()
            )
            
            # Upsert the document
            await collection.update_one(
                {"userId": user_id},
                {"$set": new_quests.model_dump()},
                upsert=True
            )
            
            return new_quests.model_dump()
        
        return serialize_mongo_doc(existing_quests)
        
    except Exception as e:
        print(f"Error fetching daily quests: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch daily quests: {str(e)}")


@router.put("/daily-quests/progress")
async def update_daily_quest_progress(request: UpdateProgressRequest):
    """
    Update progress for a specific daily quest.
    """
    try:
        db = get_db()
        collection = db.daily_quests
        
        today = get_today()
        
        # Get current daily quests
        daily_data = await collection.find_one({"userId": request.userId})
        
        if not daily_data or daily_data.get("date") != today:
            # Create new quests if they don't exist for today
            await get_daily_quests(request.userId)
            daily_data = await collection.find_one({"userId": request.userId})
        
        quests = daily_data["quests"]
        updated = False
        xp_to_award = 0
        
        # Find and update the specific quest
        for quest in quests:
            if quest["id"] == request.questId:
                if not quest["completed"] and quest["progress"] < quest["target"]:
                    quest["progress"] = min(quest["progress"] + request.increment, quest["target"])
                    
                    # Mark as completed if target reached
                    if quest["progress"] >= quest["target"]:
                        quest["completed"] = True
                        xp_to_award = quest["xp"]
                    
                    updated = True
                break
        
        # Update the document
        if updated:
            await collection.update_one(
                {"userId": request.userId},
                {"$set": {"quests": quests}}
            )
        
        return {
            "success": True,
            "quests": quests,
            "xpAwarded": xp_to_award
        }
        
    except Exception as e:
        print(f"Error updating daily quest progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")


@router.post("/daily-quests/complete-quiz")
async def complete_quiz_quest(user_id: str, correct_answers: int, total_questions: int, perfect_score: bool):
    """
    Update all relevant daily quests after completing a quiz.
    """
    try:
        db = get_db()
        collection = db.daily_quests
        
        today = get_today()
        
        # Get current daily quests
        daily_data = await collection.find_one({"userId": user_id})
        
        if not daily_data or daily_data.get("date") != today:
            await get_daily_quests(user_id)
            daily_data = await collection.find_one({"userId": user_id})
        
        quests = daily_data["quests"]
        total_xp_awarded = 0
        
        # Quest 1: Complete first quiz (id=1)
        if not quests[0]["completed"]:
            quests[0]["progress"] = 1
            quests[0]["completed"] = True
            total_xp_awarded += quests[0]["xp"]
        
        # Quest 2: Answer 10 questions correctly (id=2)
        if not quests[1]["completed"]:
            quests[1]["progress"] = min(quests[1]["progress"] + correct_answers, quests[1]["target"])
            if quests[1]["progress"] >= quests[1]["target"]:
                quests[1]["completed"] = True
                total_xp_awarded += quests[1]["xp"]
        
        # Quest 3: Perfect score (id=3)
        if not quests[2]["completed"] and perfect_score:
            quests[2]["progress"] = 1
            quests[2]["completed"] = True
            total_xp_awarded += quests[2]["xp"]
        
        # Update the document
        await collection.update_one(
            {"userId": user_id},
            {"$set": {"quests": quests}}
        )
        
        return {
            "success": True,
            "quests": quests,
            "totalXPAwarded": total_xp_awarded
        }
        
    except Exception as e:
        print(f"Error completing quiz quest: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to complete quiz quest: {str(e)}")
