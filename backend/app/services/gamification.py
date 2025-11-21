"""
Gamification Service for EduQuest AI
Handles XP calculation, rank progression, and leaderboard logic
"""

from typing import Dict, Tuple, List
from datetime import datetime, timedelta
from app.config.db import get_collection

# Rank Thresholds
RANK_THRESHOLDS = {
    "Bronze": 0,
    "Silver": 501,
    "Gold": 1501,
    "Platinum": 3001,
    "Diamond": 7501,
}

RANK_ORDER = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]

def calculate_xp(correct_answers: int, streak: int, perfect_score: bool = False) -> Tuple[int, Dict]:
    """
    Calculate XP earned from a quiz
    
    Args:
        correct_answers: Number of correct answers
        streak: Current streak count
        perfect_score: Whether user got 100%
    
    Returns:
        (total_xp, breakdown_dict)
    """
    base_xp = correct_answers * 10
    streak_bonus = streak * 5 if streak > 0 else 0
    perfect_bonus = 50 if perfect_score else 0
    
    total = base_xp + streak_bonus + perfect_bonus
    
    breakdown = {
        "base": base_xp,
        "streak_bonus": streak_bonus,
        "perfect_bonus": perfect_bonus,
        "total": total,
    }
    
    return total, breakdown

def get_rank_from_xp(xp: int) -> str:
    """
    Determine rank tier based on XP
    
    Args:
        xp: Total experience points
    
    Returns:
        Rank name (Bronze, Silver, Gold, Platinum, Diamond)
    """
    for rank in reversed(RANK_ORDER):
        if xp >= RANK_THRESHOLDS[rank]:
            return rank
    return "Bronze"

def check_rank_up(old_xp: int, new_xp: int) -> Tuple[bool, str, str]:
    """
    Check if user ranked up
    
    Args:
        old_xp: Previous XP amount
        new_xp: New XP amount
    
    Returns:
        (ranked_up: bool, old_rank: str, new_rank: str)
    """
    old_rank = get_rank_from_xp(old_xp)
    new_rank = get_rank_from_xp(new_xp)
    
    return old_rank != new_rank, old_rank, new_rank

async def update_user_xp(user_id: str, xp_to_add: int) -> Dict:
    """
    Update user's XP and check for rank up
    
    Args:
        user_id: User ID
        xp_to_add: XP to add
    
    Returns:
        Updated user stats dict
    """
    users_coll = get_collection("users")
    
    # Get current user
    user = await users_coll.find_one({"_id": user_id})
    if not user:
        raise ValueError(f"User {user_id} not found")
    
    old_xp = user.get("stats", {}).get("totalXP", 0)
    new_xp = old_xp + xp_to_add
    
    # Check rank up
    ranked_up, old_rank, new_rank = check_rank_up(old_xp, new_xp)
    
    # Update user
    update_data = {
        "$set": {
            "stats.totalXP": new_xp,
            "rank": new_rank,
            "lastActive": datetime.utcnow(),
        }
    }
    
    await users_coll.update_one({"_id": user_id}, update_data)
    
    # Update leaderboard cache
    await update_leaderboard_cache(user_id, user.get("name"), user.get("image"), new_xp, new_rank, user.get("profile", {}).get("goal"))
    
    return {
        "oldXP": old_xp,
        "newXP": new_xp,
        "xpGained": xp_to_add,
        "oldRank": old_rank,
        "newRank": new_rank,
        "rankedUp": ranked_up,
    }

async def update_streak(user_id: str, increment: bool = True) -> int:
    """
    Update user's streak
    
    Args:
        user_id: User ID
        increment: Whether to increment (True) or reset (False)
    
    Returns:
        New streak value
    """
    users_coll = get_collection("users")
    
    if increment:
        result = await users_coll.find_one_and_update(
            {"_id": user_id},
            {
                "$inc": {"stats.currentStreak": 1},
                "$set": {"lastActive": datetime.utcnow()},
            },
            return_document=True,
        )
        
        # Update longest streak if needed
        current = result.get("stats", {}).get("currentStreak", 0)
        longest = result.get("stats", {}).get("longestStreak", 0)
        if current > longest:
            await users_coll.update_one(
                {"_id": user_id},
                {"$set": {"stats.longestStreak": current}}
            )
        
        return current
    else:
        await users_coll.update_one(
            {"_id": user_id},
            {"$set": {"stats.currentStreak": 0}}
        )
        return 0

async def update_leaderboard_cache(user_id: str, username: str, avatar: str, total_xp: int, rank: str, goal: str = None):
    """
    Update or insert user in leaderboard cache collection
    """
    leaderboard_coll = get_collection("leaderboards")
    
    await leaderboard_coll.update_one(
        {"userId": user_id},
        {
            "$set": {
                "username": username,
                "avatar": avatar,
                "totalXP": total_xp,
                "rankTier": rank,
                "goal": goal,
                "updatedAt": datetime.utcnow(),
            }
        },
        upsert=True,
    )

async def get_leaderboard(goal: str = None, limit: int = 100) -> List[Dict]:
    """
    Get leaderboard rankings
    
    Args:
        goal: Filter by goal (SAT, GRE, STEM, General) or None for global
        limit: Number of top players to return
    
    Returns:
        List of leaderboard entries
    """
    leaderboard_coll = get_collection("leaderboards")
    
    query = {}
    if goal:
        query["goal"] = goal
    
    cursor = leaderboard_coll.find(query).sort("totalXP", -1).limit(limit)
    entries = await cursor.to_list(length=limit)
    
    # Add rank numbers
    for i, entry in enumerate(entries):
        entry["rank"] = i + 1
    
    return entries

async def calculate_percentile(user_id: str, goal: str = None) -> float:
    """
    Calculate user's percentile ranking
    
    Args:
        user_id: User ID
        goal: Goal filter (optional)
    
    Returns:
        Percentile (0-100, where 100 is top 1%)
    """
    leaderboard_coll = get_collection("leaderboards")
    
    # Get user's XP
    user_entry = await leaderboard_coll.find_one({"userId": user_id})
    if not user_entry:
        return 0.0
    
    user_xp = user_entry.get("totalXP", 0)
    
    # Count total users
    query = {}
    if goal:
        query["goal"] = goal
    
    total_users = await leaderboard_coll.count_documents(query)
    if total_users == 0:
        return 100.0
    
    # Count users with higher XP
    query_higher = {"totalXP": {"$gt": user_xp}}
    if goal:
        query_higher["goal"] = goal
    
    users_above = await leaderboard_coll.count_documents(query_higher)
    
    # Calculate percentile (100 - percentage of users above)
    percentile = 100 - (users_above / total_users * 100)
    
    return round(percentile, 1)

async def get_daily_champion(date: datetime = None) -> Dict | None:
    """
    Get the daily champion (most XP gained in last 24h)
    
    Args:
        date: Date to check (default: today)
    
    Returns:
        Champion user dict or None
    """
    # TODO: Implement daily XP tracking
    # For now, return None (will be implemented with daily_xp collection)
    return None
