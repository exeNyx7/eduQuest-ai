"""
Achievement Badges System
Tracks and awards badges for various accomplishments
"""

from typing import List, Dict
from datetime import datetime
from app.config.db import get_collection
from bson import ObjectId

# Achievement Definitions
ACHIEVEMENTS = {
    "first_quest": {
        "id": "first_quest",
        "name": "First Steps",
        "description": "Complete your first quiz",
        "icon": "🎯",
        "xp_reward": 10,
    },
    "perfectionist": {
        "id": "perfectionist",
        "name": "Perfectionist",
        "description": "Get 100% on a quiz",
        "icon": "💯",
        "xp_reward": 50,
    },
    "bronze_rank": {
        "id": "bronze_rank",
        "name": "Bronze Warrior",
        "description": "Reach Bronze rank",
        "icon": "🥉",
        "xp_reward": 25,
    },
    "silver_rank": {
        "id": "silver_rank",
        "name": "Silver Knight",
        "description": "Reach Silver rank",
        "icon": "🥈",
        "xp_reward": 50,
    },
    "gold_rank": {
        "id": "gold_rank",
        "name": "Gold Champion",
        "description": "Reach Gold rank",
        "icon": "🥇",
        "xp_reward": 100,
    },
    "platinum_rank": {
        "id": "platinum_rank",
        "name": "Platinum Legend",
        "description": "Reach Platinum rank",
        "icon": "💎",
        "xp_reward": 200,
    },
    "diamond_rank": {
        "id": "diamond_rank",
        "name": "Diamond Master",
        "description": "Reach Diamond rank",
        "icon": "👑",
        "xp_reward": 500,
    },
    "streak_3": {
        "id": "streak_3",
        "name": "On Fire",
        "description": "Maintain a 3-day streak",
        "icon": "🔥",
        "xp_reward": 30,
    },
    "streak_7": {
        "id": "streak_7",
        "name": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "icon": "⚡",
        "xp_reward": 75,
    },
    "streak_30": {
        "id": "streak_30",
        "name": "Dedication",
        "description": "Maintain a 30-day streak",
        "icon": "🌟",
        "xp_reward": 300,
    },
    "quest_10": {
        "id": "quest_10",
        "name": "Adventurer",
        "description": "Complete 10 quests",
        "icon": "🗺️",
        "xp_reward": 50,
    },
    "quest_50": {
        "id": "quest_50",
        "name": "Explorer",
        "description": "Complete 50 quests",
        "icon": "🧭",
        "xp_reward": 150,
    },
    "quest_100": {
        "id": "quest_100",
        "name": "Conqueror",
        "description": "Complete 100 quests",
        "icon": "🏆",
        "xp_reward": 500,
    },
    "correct_100": {
        "id": "correct_100",
        "name": "Smarty Pants",
        "description": "Answer 100 questions correctly",
        "icon": "🧠",
        "xp_reward": 100,
    },
    "correct_500": {
        "id": "correct_500",
        "name": "Genius",
        "description": "Answer 500 questions correctly",
        "icon": "🎓",
        "xp_reward": 300,
    },
    "xp_1000": {
        "id": "xp_1000",
        "name": "Rising Star",
        "description": "Earn 1,000 total XP",
        "icon": "⭐",
        "xp_reward": 100,
    },
    "xp_5000": {
        "id": "xp_5000",
        "name": "Power User",
        "description": "Earn 5,000 total XP",
        "icon": "💪",
        "xp_reward": 250,
    },
    "xp_10000": {
        "id": "xp_10000",
        "name": "Legendary",
        "description": "Earn 10,000 total XP",
        "icon": "🌠",
        "xp_reward": 1000,
    },
}


async def check_achievements(user_id: str, user_stats: Dict) -> List[Dict]:
    """
    Check if user has unlocked any new achievements
    
    Args:
        user_id: User ID (string or ObjectId)
        user_stats: Current user stats
    
    Returns:
        List of newly unlocked achievements
    """
    users_coll = get_collection("users")
    
    # Convert to ObjectId if needed
    if isinstance(user_id, str) and not user_id.startswith("guest_"):
        try:
            user_id = ObjectId(user_id)
        except:
            return []
    
    # Get user's current achievements
    user = await users_coll.find_one({"_id": user_id})
    if not user:
        return []
    
    earned_achievements = user.get("achievements", [])
    newly_unlocked = []
    
    # Check each achievement condition
    total_xp = user_stats.get("totalXP", 0)
    quests_completed = user_stats.get("questsCompleted", 0)
    current_streak = user_stats.get("currentStreak", 0)
    correct_answers = user_stats.get("correctAnswers", 0)
    rank = user.get("rank", "Bronze")
    
    # First quest
    if "first_quest" not in earned_achievements and quests_completed >= 1:
        newly_unlocked.append(ACHIEVEMENTS["first_quest"])
    
    # Rank achievements
    rank_achievements = {
        "Bronze": "bronze_rank",
        "Silver": "silver_rank",
        "Gold": "gold_rank",
        "Platinum": "platinum_rank",
        "Diamond": "diamond_rank",
    }
    if rank in rank_achievements:
        ach_id = rank_achievements[rank]
        if ach_id not in earned_achievements:
            newly_unlocked.append(ACHIEVEMENTS[ach_id])
    
    # Streak achievements
    if "streak_30" not in earned_achievements and current_streak >= 30:
        newly_unlocked.append(ACHIEVEMENTS["streak_30"])
    elif "streak_7" not in earned_achievements and current_streak >= 7:
        newly_unlocked.append(ACHIEVEMENTS["streak_7"])
    elif "streak_3" not in earned_achievements and current_streak >= 3:
        newly_unlocked.append(ACHIEVEMENTS["streak_3"])
    
    # Quest count achievements
    if "quest_100" not in earned_achievements and quests_completed >= 100:
        newly_unlocked.append(ACHIEVEMENTS["quest_100"])
    elif "quest_50" not in earned_achievements and quests_completed >= 50:
        newly_unlocked.append(ACHIEVEMENTS["quest_50"])
    elif "quest_10" not in earned_achievements and quests_completed >= 10:
        newly_unlocked.append(ACHIEVEMENTS["quest_10"])
    
    # Correct answers achievements
    if "correct_500" not in earned_achievements and correct_answers >= 500:
        newly_unlocked.append(ACHIEVEMENTS["correct_500"])
    elif "correct_100" not in earned_achievements and correct_answers >= 100:
        newly_unlocked.append(ACHIEVEMENTS["correct_100"])
    
    # XP achievements
    if "xp_10000" not in earned_achievements and total_xp >= 10000:
        newly_unlocked.append(ACHIEVEMENTS["xp_10000"])
    elif "xp_5000" not in earned_achievements and total_xp >= 5000:
        newly_unlocked.append(ACHIEVEMENTS["xp_5000"])
    elif "xp_1000" not in earned_achievements and total_xp >= 1000:
        newly_unlocked.append(ACHIEVEMENTS["xp_1000"])
    
    # Update user's achievements
    if newly_unlocked:
        new_achievement_ids = [ach["id"] for ach in newly_unlocked]
        await users_coll.update_one(
            {"_id": user_id},
            {
                "$addToSet": {"achievements": {"$each": new_achievement_ids}},
                "$set": {"updatedAt": datetime.utcnow()},
            }
        )
    
    return newly_unlocked


async def get_user_achievements(user_id: str) -> List[Dict]:
    """
    Get all achievements earned by user
    
    Args:
        user_id: User ID
    
    Returns:
        List of achievement objects
    """
    users_coll = get_collection("users")
    
    # Convert to ObjectId if needed
    if isinstance(user_id, str) and not user_id.startswith("guest_"):
        try:
            user_id = ObjectId(user_id)
        except:
            return []
    
    user = await users_coll.find_one({"_id": user_id})
    if not user:
        return []
    
    earned_ids = user.get("achievements", [])
    return [ACHIEVEMENTS[aid] for aid in earned_ids if aid in ACHIEVEMENTS]


async def get_all_achievements() -> List[Dict]:
    """
    Get all available achievements
    
    Returns:
        List of all achievement definitions
    """
    return list(ACHIEVEMENTS.values())
