"""
Weekly Quests API Routes
Handles weekly quest data persistence, progress tracking, and weekly resets
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from app.config.db import get_db

router = APIRouter()

class QuestProgress(BaseModel):
    id: str
    title: str
    description: str
    progress: int
    target: int
    xp: int
    completed: bool

class WeeklyQuestsData(BaseModel):
    userId: str
    weekStart: str  # ISO date string for Monday of the current week
    quests: List[QuestProgress]
    allCompleted: bool
    bonusAwarded: bool

class UpdateProgressRequest(BaseModel):
    userId: str
    quizScore: Optional[int] = None
    currentStreak: Optional[int] = None


def get_week_start() -> str:
    """Get the Monday of the current week (ISO format)"""
    now = datetime.now()
    day_of_week = now.weekday()  # Monday = 0, Sunday = 6
    days_to_monday = day_of_week  # Days to go back to Monday
    monday = now - timedelta(days=days_to_monday)
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    return monday.strftime("%Y-%m-%d")


def create_default_quests() -> List[QuestProgress]:
    """Create the default set of weekly quests"""
    return [
        QuestProgress(
            id="quiz_marathon",
            title="Quiz Marathon",
            description="Complete 20 quizzes this week",
            progress=0,
            target=20,
            xp=200,
            completed=False
        ),
        QuestProgress(
            id="perfect_scholar",
            title="Perfect Scholar",
            description="Score 90% or higher in 10 quizzes",
            progress=0,
            target=10,
            xp=300,
            completed=False
        ),
        QuestProgress(
            id="streak_master",
            title="Streak Master",
            description="Maintain a 7-day streak",
            progress=0,
            target=7,
            xp=500,
            completed=False
        )
    ]


@router.get("/weekly-quests/{user_id}")
async def get_weekly_quests(user_id: str):
    """
    Get or create weekly quests for a user.
    Automatically resets if a new week has started.
    """
    try:
        db = get_db()
        collection = db.weekly_quests
        
        current_week_start = get_week_start()
        
        # Find existing weekly quests for this user
        existing_quests = await collection.find_one({"userId": user_id})
        
        # If no quests exist or it's a new week, create/reset
        if not existing_quests or existing_quests.get("weekStart") != current_week_start:
            new_quests = WeeklyQuestsData(
                userId=user_id,
                weekStart=current_week_start,
                quests=create_default_quests(),
                allCompleted=False,
                bonusAwarded=False
            )
            
            # Upsert the document
            await collection.update_one(
                {"userId": user_id},
                {"$set": new_quests.model_dump()},
                upsert=True
            )
            
            return new_quests.model_dump()
        
        return existing_quests
        
    except Exception as e:
        print(f"Error fetching weekly quests: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weekly quests: {str(e)}")


@router.put("/weekly-quests/progress")
async def update_weekly_quest_progress(request: UpdateProgressRequest):
    """
    Update progress for weekly quests based on quiz completion.
    Handles: quiz count, 90%+ scores, and streak tracking.
    """
    try:
        db = get_db()
        collection = db.weekly_quests
        
        current_week_start = get_week_start()
        
        # Get current weekly quests
        weekly_data = await collection.find_one({"userId": request.userId})
        
        if not weekly_data or weekly_data.get("weekStart") != current_week_start:
            # Create new quests if they don't exist for this week
            await get_weekly_quests(request.userId)
            weekly_data = await collection.find_one({"userId": request.userId})
        
        quests = weekly_data["quests"]
        updated = False
        
        # Update Quest 1: Quiz Marathon (increment quiz count)
        if quests[0]["progress"] < quests[0]["target"] and not quests[0]["completed"]:
            quests[0]["progress"] += 1
            if quests[0]["progress"] >= quests[0]["target"]:
                quests[0]["completed"] = True
            updated = True
        
        # Update Quest 2: Perfect Scholar (90%+ scores)
        if request.quizScore is not None and request.quizScore >= 90:
            if quests[1]["progress"] < quests[1]["target"] and not quests[1]["completed"]:
                quests[1]["progress"] += 1
                if quests[1]["progress"] >= quests[1]["target"]:
                    quests[1]["completed"] = True
                updated = True
        
        # Update Quest 3: Streak Master (check current streak)
        if request.currentStreak is not None:
            current_progress = min(request.currentStreak, quests[2]["target"])
            if current_progress > quests[2]["progress"]:
                quests[2]["progress"] = current_progress
                if quests[2]["progress"] >= quests[2]["target"]:
                    quests[2]["completed"] = True
                updated = True
        
        # Check if all quests are completed
        all_completed = all(q["completed"] for q in quests)
        
        # Calculate total XP earned (only if not already awarded)
        xp_to_award = 0
        if updated:
            # Award XP for newly completed quests
            for quest in quests:
                if quest["completed"]:
                    xp_to_award += quest["xp"]
            
            # Award bonus if all quests completed and not yet awarded
            if all_completed and not weekly_data.get("bonusAwarded", False):
                xp_to_award += 200  # Bonus XP
                weekly_data["bonusAwarded"] = True
        
        # Update the document
        if updated:
            await collection.update_one(
                {"userId": request.userId},
                {"$set": {
                    "quests": quests,
                    "allCompleted": all_completed,
                    "bonusAwarded": weekly_data.get("bonusAwarded", False)
                }}
            )
        
        return {
            "success": True,
            "quests": quests,
            "allCompleted": all_completed,
            "xpAwarded": xp_to_award
        }
        
    except Exception as e:
        print(f"Error updating weekly quest progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")


@router.get("/weekly-quests/{user_id}/time-remaining")
async def get_time_remaining(user_id: str):
    """
    Get the time remaining until the next weekly reset (Monday midnight).
    """
    try:
        now = datetime.now()
        
        # Calculate next Monday at midnight
        days_until_monday = (7 - now.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7  # If today is Monday, next reset is in 7 days
        
        next_monday = now + timedelta(days=days_until_monday)
        next_monday = next_monday.replace(hour=0, minute=0, second=0, microsecond=0)
        
        time_diff = next_monday - now
        
        days = time_diff.days
        hours = time_diff.seconds // 3600
        minutes = (time_diff.seconds % 3600) // 60
        seconds = time_diff.seconds % 60
        
        return {
            "nextReset": next_monday.isoformat(),
            "timeRemaining": {
                "days": days,
                "hours": hours,
                "minutes": minutes,
                "seconds": seconds,
                "totalSeconds": int(time_diff.total_seconds())
            }
        }
        
    except Exception as e:
        print(f"Error calculating time remaining: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate time: {str(e)}")
