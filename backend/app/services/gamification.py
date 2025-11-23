"""
Gamification Service for EduQuest AI
Handles XP calculation, rank progression, and leaderboard logic
"""

from typing import Dict, Tuple, List, Union
from datetime import datetime, timedelta
from bson import ObjectId
from app.config.db import get_collection

def _to_object_id(user_id: Union[str, ObjectId]) -> ObjectId:
    """Convert string ID to ObjectId if needed"""
    if isinstance(user_id, ObjectId):
        return user_id
    try:
        return ObjectId(user_id)
    except Exception:
        raise ValueError(f"Invalid user ID format: {user_id}")

# Rank Thresholds
RANK_THRESHOLDS = {
    "Bronze": 0,
    "Silver": 501,
    "Gold": 1501,
    "Platinum": 3001,
    "Diamond": 7501,
}

RANK_ORDER = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]

# Streak Multipliers
STREAK_MULTIPLIERS = {
    7: 1.5,    # 7 days - 1.5x XP
    30: 2.0,   # 30 days - 2x XP
    100: 3.0,  # 100 days - 3x XP
}

# Streak Milestones (when to award freeze tokens and bonus XP)
STREAK_MILESTONES = {
    7: {"freeze_tokens": 1, "bonus_xp": 100, "title": "Week Warrior"},
    30: {"freeze_tokens": 2, "bonus_xp": 500, "title": "Monthly Master"},
    100: {"freeze_tokens": 5, "bonus_xp": 2000, "title": "Century Champion"},
    365: {"freeze_tokens": 10, "bonus_xp": 10000, "title": "Year Legend"},
}

# Daily Login Bonuses (consecutive days -> rewards)
DAILY_LOGIN_BONUSES = {
    1: {"xp": 10, "message": "Welcome back! 🎉"},
    3: {"xp": 25, "message": "3 days strong! Keep it up! 💪"},
    7: {"xp": 50, "freeze_tokens": 1, "message": "A full week! Here's a freeze token! 🛡️"},
    14: {"xp": 100, "freeze_tokens": 1, "message": "Two weeks of dedication! 🌟"},
    30: {"xp": 200, "freeze_tokens": 2, "badge": "Monthly Login Master", "message": "30 days! You're unstoppable! 🏆"},
    50: {"xp": 300, "freeze_tokens": 2, "message": "50 days! Amazing commitment! 🎯"},
    100: {"xp": 500, "freeze_tokens": 5, "badge": "Century Learner", "message": "100 days! Legendary dedication! 👑"},
}

def get_streak_multiplier(streak: int) -> float:
    """
    Get XP multiplier based on current streak
    
    Args:
        streak: Current streak count
    
    Returns:
        Multiplier (1.0, 1.5, 2.0, or 3.0)
    """
    multiplier = 1.0
    for milestone, mult in sorted(STREAK_MULTIPLIERS.items(), reverse=True):
        if streak >= milestone:
            multiplier = mult
            break
    return multiplier

def calculate_xp(correct_answers: int, streak: int, perfect_score: bool = False, time_bonus: int = 0) -> Tuple[int, Dict]:
    """
    Calculate XP earned from a quiz with streak multiplier
    
    Args:
        correct_answers: Number of correct answers
        streak: Current streak count
        perfect_score: Whether user got 100%
        time_bonus: Bonus XP from completing quiz quickly
    
    Returns:
        (total_xp, breakdown_dict)
    """
    base_xp = correct_answers * 10
    streak_bonus = streak * 5 if streak > 0 else 0
    perfect_bonus = 50 if perfect_score else 0
    
    # Calculate subtotal before multiplier
    subtotal = base_xp + streak_bonus + perfect_bonus + time_bonus
    
    # Apply streak multiplier
    multiplier = get_streak_multiplier(streak)
    total = int(subtotal * multiplier)
    
    breakdown = {
        "base": base_xp,
        "streak_bonus": streak_bonus,
        "perfect_bonus": perfect_bonus,
        "time_bonus": time_bonus,
        "subtotal": subtotal,
        "streak_multiplier": multiplier,
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
        user_id: User ID (string or ObjectId)
        xp_to_add: XP to add
    
    Returns:
        Updated user stats dict
    """
    users_coll = get_collection("users")
    user_oid = _to_object_id(user_id)
    
    # Get current user
    user = await users_coll.find_one({"_id": user_oid})
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
    
    await users_coll.update_one({"_id": user_oid}, update_data)
    
    # Update leaderboard cache
    await update_leaderboard_cache(str(user_oid), user.get("name"), user.get("image"), new_xp, new_rank, user.get("profile", {}).get("goal"))
    
    return {
        "oldXP": old_xp,
        "newXP": new_xp,
        "xpGained": xp_to_add,
        "oldRank": old_rank,
        "newRank": new_rank,
        "rankedUp": ranked_up,
    }

async def update_streak(user_id: str) -> dict:
    """
    Update user's daily streak (only increments once per day)
    Checks for streak freeze protection and milestone rewards
    
    Args:
        user_id: User ID (string or ObjectId)
    
    Returns:
        Dict with streak info: {"currentStreak": int, "updated": bool, "milestone": dict|None}
    """
    users_coll = get_collection("users")
    user_oid = _to_object_id(user_id)
    
    user = await users_coll.find_one({"_id": user_oid})
    if not user:
        return {"currentStreak": 0, "updated": False, "milestone": None}
    
    now = datetime.utcnow()
    last_active = user.get("lastActiveDate")
    
    # Convert to date only (ignore time)
    today = now.date()
    last_active_date = last_active.date() if last_active else None
    
    current_streak = user.get("stats", {}).get("currentStreak", 0)
    
    # If already active today, don't update streak
    if last_active_date == today:
        return {"currentStreak": current_streak, "updated": False, "milestone": None}
    
    # Check if streak continues (last active was yesterday)
    from datetime import timedelta
    yesterday = today - timedelta(days=1)
    
    milestone = None
    
    if last_active_date == yesterday:
        # Continue streak
        new_streak = current_streak + 1
        
        # Check for milestone rewards
        milestone = await check_streak_milestone(user_id, new_streak)
        
    elif last_active_date is None or (today - last_active_date).days > 1:
        # Check if freeze is active to protect streak
        freeze_protected = await check_and_apply_freeze(user_id)
        
        if freeze_protected:
            # Freeze protected the streak, continue it
            new_streak = current_streak + 1
            # Deactivate freeze after use
            await users_coll.update_one(
                {"_id": user_oid},
                {"$set": {"streakFreezeActive": False}}
            )
        else:
            # Streak broken - start at 1
            new_streak = 1
    else:
        new_streak = 1
    
    # Update user
    result = await users_coll.find_one_and_update(
        {"_id": user_oid},
        {
            "$set": {
                "stats.currentStreak": new_streak,
                "lastActiveDate": now,
                "lastActive": now,
            }
        },
        return_document=True,
    )
    
    # Update longest streak if needed
    longest = result.get("stats", {}).get("longestStreak", 0)
    if new_streak > longest:
        await users_coll.update_one(
            {"_id": user_oid},
            {"$set": {"stats.longestStreak": new_streak}}
        )
    
    return {
        "currentStreak": new_streak,
        "updated": True,
        "milestone": milestone,
        "multiplier": get_streak_multiplier(new_streak),
    }

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

async def check_streak_milestone(user_id: str, new_streak: int) -> Dict:
    """
    Check if user hit a streak milestone and award rewards
    
    Args:
        user_id: User ID
        new_streak: Current streak count
    
    Returns:
        Dict with milestone info or None
    """
    users_coll = get_collection("users")
    user_oid = _to_object_id(user_id)
    
    # Check if this streak value is a milestone
    if new_streak not in STREAK_MILESTONES:
        return None
    
    milestone_data = STREAK_MILESTONES[new_streak]
    
    # Check if user already claimed this milestone
    user = await users_coll.find_one({"_id": user_oid})
    claimed_milestones = user.get("streakMilestonesReached", [])
    
    if new_streak in claimed_milestones:
        return None  # Already claimed
    
    # Award rewards
    freeze_tokens = milestone_data["freeze_tokens"]
    bonus_xp = milestone_data["bonus_xp"]
    
    # Update user with rewards
    current_freezes = user.get("streakFreezes", 0)
    current_xp = user.get("stats", {}).get("totalXP", 0)
    
    await users_coll.update_one(
        {"_id": user_oid},
        {
            "$set": {
                "streakFreezes": current_freezes + freeze_tokens,
                "stats.totalXP": current_xp + bonus_xp,
            },
            "$push": {"streakMilestonesReached": new_streak}
        }
    )
    
    return {
        "milestone": new_streak,
        "title": milestone_data["title"],
        "freeze_tokens": freeze_tokens,
        "bonus_xp": bonus_xp,
        "total_freezes": current_freezes + freeze_tokens,
    }

async def use_streak_freeze(user_id: str) -> Dict:
    """
    Use a streak freeze token to protect streak
    
    Args:
        user_id: User ID
    
    Returns:
        Dict with success status and remaining freezes
    """
    users_coll = get_collection("users")
    user_oid = _to_object_id(user_id)
    
    user = await users_coll.find_one({"_id": user_oid})
    if not user:
        raise ValueError(f"User {user_id} not found")
    
    current_freezes = user.get("streakFreezes", 0)
    
    if current_freezes <= 0:
        return {
            "success": False,
            "error": "No freeze tokens available",
            "freezes_remaining": 0,
        }
    
    # Use one freeze token and mark as protected
    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)
    
    await users_coll.update_one(
        {"_id": user_oid},
        {
            "$set": {
                "streakFreezes": current_freezes - 1,
                "streakFreezeActive": True,
                "streakFreezeExpiry": tomorrow,
                "lastActive": now,
            }
        }
    )
    
    return {
        "success": True,
        "freezes_remaining": current_freezes - 1,
        "protected_until": tomorrow.isoformat(),
    }

async def check_and_apply_freeze(user_id: str) -> bool:
    """
    Check if streak freeze is active and should protect streak
    
    Args:
        user_id: User ID
    
    Returns:
        True if freeze protected the streak, False otherwise
    """
    users_coll = get_collection("users")
    user_oid = _to_object_id(user_id)
    
    user = await users_coll.find_one({"_id": user_oid})
    if not user:
        return False
    
    freeze_active = user.get("streakFreezeActive", False)
    freeze_expiry = user.get("streakFreezeExpiry")
    
    if not freeze_active or not freeze_expiry:
        return False
    
    # Check if freeze is still valid
    now = datetime.utcnow()
    if now > freeze_expiry:
        # Freeze expired, deactivate it
        await users_coll.update_one(
            {"_id": user_oid},
            {"$set": {"streakFreezeActive": False}}
        )
        return False
    
    # Freeze is active and valid
    return True

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


async def check_daily_login_bonus(user_id: Union[str, ObjectId]) -> Dict:
    """
    Check if user can claim daily login bonus and calculate rewards
    
    Args:
        user_id: User ID (string or ObjectId)
    
    Returns:
        Dict with claimable status and reward details
    """
    users_coll = get_collection("users")
    user_object_id = _to_object_id(user_id)
    
    user = await users_coll.find_one({"_id": user_object_id})
    if not user:
        return {"claimable": False, "error": "User not found"}
    
    now = datetime.utcnow()
    last_login = user.get("lastLoginDate")
    last_bonus_claim = user.get("lastBonusClaimDate")
    login_streak = user.get("loginStreak", 0)
    
    # Check if bonus already claimed today
    if last_bonus_claim:
        if isinstance(last_bonus_claim, str):
            last_bonus_claim = datetime.fromisoformat(last_bonus_claim.replace('Z', '+00:00'))
        
        # If claimed today, not claimable
        if last_bonus_claim.date() == now.date():
            return {
                "claimable": False,
                "reason": "Already claimed today",
                "loginStreak": login_streak,
                "nextBonus": _get_next_bonus_info(login_streak + 1)
            }
    
    # Calculate new login streak
    if last_login:
        if isinstance(last_login, str):
            last_login = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
        
        days_diff = (now.date() - last_login.date()).days
        
        if days_diff == 0:
            # Same day - keep streak
            new_streak = login_streak
        elif days_diff == 1:
            # Consecutive day - increment streak
            new_streak = login_streak + 1
        else:
            # Streak broken - reset to 1
            new_streak = 1
    else:
        # First login
        new_streak = 1
    
    # Get bonus for current streak
    bonus = _get_login_bonus(new_streak)
    
    return {
        "claimable": True,
        "loginStreak": new_streak,
        "oldStreak": login_streak,
        "bonus": bonus,
        "nextBonus": _get_next_bonus_info(new_streak + 1)
    }


async def claim_daily_login_bonus(user_id: Union[str, ObjectId]) -> Dict:
    """
    Claim daily login bonus and award rewards
    
    Args:
        user_id: User ID (string or ObjectId)
    
    Returns:
        Dict with success status and rewards awarded
    """
    users_coll = get_collection("users")
    user_object_id = _to_object_id(user_id)
    
    # Check if claimable
    check_result = await check_daily_login_bonus(user_id)
    
    if not check_result.get("claimable"):
        return {
            "success": False,
            "error": check_result.get("reason", "Cannot claim bonus")
        }
    
    new_streak = check_result["loginStreak"]
    bonus = check_result["bonus"]
    
    # Prepare update
    now = datetime.utcnow()
    update_data = {
        "$set": {
            "lastLoginDate": now,
            "lastBonusClaimDate": now,
            "loginStreak": new_streak
        },
        "$inc": {}
    }
    
    # Award XP
    if bonus.get("xp", 0) > 0:
        update_data["$inc"]["stats.totalXP"] = bonus["xp"]
    
    # Award freeze tokens
    if bonus.get("freeze_tokens", 0) > 0:
        update_data["$inc"]["streakFreezes"] = bonus["freeze_tokens"]
    
    # Award badge (add to achievements)
    if bonus.get("badge"):
        update_data["$addToSet"] = {
            "loginBadges": {
                "name": bonus["badge"],
                "earnedAt": now,
                "days": new_streak
            }
        }
    
    # Update user
    result = await users_coll.update_one(
        {"_id": user_object_id},
        update_data
    )
    
    if result.modified_count == 0:
        return {"success": False, "error": "Failed to update user"}
    
    # Get updated user to return new totals
    updated_user = await users_coll.find_one({"_id": user_object_id})
    
    return {
        "success": True,
        "loginStreak": new_streak,
        "bonus": bonus,
        "newTotalXP": updated_user.get("stats", {}).get("totalXP", 0),
        "newFreezeTokens": updated_user.get("streakFreezes", 0),
        "message": bonus.get("message", "Bonus claimed!")
    }


def _get_login_bonus(streak: int) -> Dict:
    """
    Get login bonus for a specific streak day
    
    Args:
        streak: Login streak count
    
    Returns:
        Bonus dict with rewards
    """
    # Check for exact match
    if streak in DAILY_LOGIN_BONUSES:
        return DAILY_LOGIN_BONUSES[streak].copy()
    
    # For non-milestone days, give base XP
    return {
        "xp": 5,
        "message": f"Day {streak}! Keep the streak alive! 🔥"
    }


def _get_next_bonus_info(next_streak: int) -> Dict:
    """
    Get information about the next milestone bonus
    
    Args:
        next_streak: Next streak count
    
    Returns:
        Info about next milestone
    """
    # Find next milestone
    for milestone in sorted(DAILY_LOGIN_BONUSES.keys()):
        if milestone >= next_streak:
            bonus = DAILY_LOGIN_BONUSES[milestone]
            return {
                "daysUntil": milestone - next_streak + 1,
                "milestone": milestone,
                "rewards": {
                    "xp": bonus.get("xp", 0),
                    "freeze_tokens": bonus.get("freeze_tokens", 0),
                    "badge": bonus.get("badge")
                }
            }
    
    # No more milestones
    return None
