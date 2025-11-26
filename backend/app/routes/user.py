from fastapi import APIRouter, HTTPException
from typing import Optional
from bson import ObjectId

from app.models.user_schemas import (
    QuizResultRequest,
    QuizResultResponse,
    LeaderboardResponse,
    LeaderboardEntry,
    UpdateStatsRequest,
    UpdateStatsResponse,
    User,
    Achievement,
)
from app.services.gamification import (
    calculate_xp,
    update_user_xp,
    update_streak,
    get_leaderboard,
    calculate_percentile,
    get_streak_multiplier,
    use_streak_freeze,
    check_daily_login_bonus,
    claim_daily_login_bonus,
)
from app.services.achievements import check_achievements, get_user_achievements
from app.config.db import get_collection

router = APIRouter(tags=["user"])

@router.post("/submit-quiz", response_model=QuizResultResponse)
async def submit_quiz_result(req: QuizResultRequest):
    """
    Submit quiz results and update user stats/XP
    """
    try:
        print(f"[QUIZ SUBMIT] User {req.user_id} completed quiz - Score: {req.score}/{req.totalQuestions}")
        
        # Check if guest user (starts with "guest_")
        is_guest = req.user_id.startswith("guest_")
        
        if is_guest:
            # Guest mode: Calculate XP but don't save to DB
            print(f"[QUIZ SUBMIT] Guest user detected - calculating XP only")
            xp_earned, breakdown = calculate_xp(
                req.correctAnswers,
                0,  # No streak for guests
                req.perfectScore
            )
            
            print(f"[QUIZ SUBMIT] XP Earned: {xp_earned} (Base: {breakdown['base']}, Perfect: {breakdown['perfect_bonus']})")
            
            return QuizResultResponse(
                xpEarned=xp_earned,
                breakdown=breakdown,
                newTotalXP=xp_earned,  # Guest starts fresh
                newRank="Bronze",
                rankedUp=False,
                questsCompleted=[],
            )
        
        # Registered user: Full stats tracking
        users_coll = get_collection("users")
        
        # Convert string ID to ObjectId
        try:
            user_object_id = ObjectId(req.user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        user = await users_coll.find_one({"_id": user_object_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_streak = user.get("stats", {}).get("currentStreak", 0)
        
        # Calculate time bonus if provided
        time_bonus = 0
        if hasattr(req, 'timeBonus') and req.timeBonus:
            time_bonus = req.timeBonus
        
        # Get streak multiplier
        multiplier = get_streak_multiplier(current_streak)
        
        xp_earned, breakdown = calculate_xp(
            req.correctAnswers,
            current_streak,
            req.perfectScore,
            time_bonus,
            multiplier
        )
        
        print(f"[QUIZ SUBMIT] XP Earned: {xp_earned} (Base: {breakdown['base']}, Streak: {breakdown['streak_bonus']}, Perfect: {breakdown['perfect_bonus']}, Time: {breakdown['time_bonus']}, Multiplier: {multiplier}x)")
        
        # Update XP and rank (pass string, will be converted in function)
        xp_result = await update_user_xp(req.user_id, xp_earned)
        
        # Update answer counts (use ObjectId here)
        await users_coll.update_one(
            {"_id": user_object_id},
            {
                "$inc": {
                    "stats.correctAnswers": req.correctAnswers,
                    "stats.wrongAnswers": req.wrongAnswers,
                    "stats.questsCompleted": 1,
                }
            }
        )
        
        # Update daily streak (only once per day)
        streak_result = await update_streak(req.user_id)
        if streak_result["updated"]:
            print(f"[QUIZ SUBMIT] Daily streak updated: {streak_result['currentStreak']}")
            if streak_result.get("milestone"):
                print(f"[QUIZ SUBMIT] 🎉 Milestone reached: {streak_result['milestone']['days']} days!")
        else:
            print(f"[QUIZ SUBMIT] Streak already updated today: {streak_result['currentStreak']}")
        
        # Check for newly unlocked achievements
        updated_user = await users_coll.find_one({"_id": user_object_id})
        user_stats = {
            "totalXP": updated_user.get("stats", {}).get("totalXP", 0),
            "rank": xp_result["newRank"],
            "questsCompleted": updated_user.get("stats", {}).get("questsCompleted", 0),
            "streak": updated_user.get("stats", {}).get("currentStreak", 0),
            "longestStreak": updated_user.get("stats", {}).get("longestStreak", 0),
            "totalCorrect": updated_user.get("stats", {}).get("totalCorrect", 0),
            "isPerfect": req.score == 100,
        }
        newly_unlocked = await check_achievements(req.user_id, user_stats)
        print(f"[QUIZ SUBMIT] Achievements unlocked: {[a['name'] for a in newly_unlocked]}")
        
        # TODO: Check and update daily quests
        quests_completed = []
        
        # Prepare milestone data if reached
        milestone_data = None
        if streak_result.get("milestone"):
            milestone_info = streak_result["milestone"]
            from app.models.user_schemas import StreakMilestone
            milestone_data = StreakMilestone(
                days=milestone_info["days"],
                freezeTokens=milestone_info["freezeTokens"],
                bonusXP=milestone_info["bonusXP"]
            )
        
        print(f"[QUIZ SUBMIT] ✅ Success! New XP: {xp_result['newXP']}, Rank: {xp_result['newRank']}, Multiplier: {multiplier}x")
        
        return QuizResultResponse(
            xpEarned=xp_earned,
            breakdown=breakdown,
            newTotalXP=xp_result["newXP"],
            newRank=xp_result["newRank"],
            rankedUp=xp_result["rankedUp"],
            questsCompleted=quests_completed,
            achievementsUnlocked=newly_unlocked,
            streakMilestone=milestone_data,
            streakMultiplier=multiplier,
        )
    
    except Exception as e:
        print(f"[QUIZ SUBMIT ERROR] {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    """
    Get user profile with stats
    """
    try:
        users_coll = get_collection("users")
        
        # Convert string ID to ObjectId
        try:
            user_object_id = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        user = await users_coll.find_one({"_id": user_object_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Convert ObjectId to string for JSON response
        user["_id"] = str(user["_id"])
        
        return user
    
    except Exception as e:
        print(f"[GET PROFILE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard_rankings(
    goal: Optional[str] = None,
    limit: int = 100,
    user_id: Optional[str] = None
):
    """
    Get leaderboard rankings
    
    Query params:
    - goal: Filter by goal (SAT, GRE, STEM, General) - optional
    - limit: Number of top players (default: 100)
    - user_id: Calculate percentile for this user - optional
    """
    try:
        print(f"[LEADERBOARD] Fetching top {limit} players" + (f" for goal: {goal}" if goal else " (global)"))
        
        # Get leaderboard
        entries_raw = await get_leaderboard(goal, limit)
        
        entries = [
            LeaderboardEntry(
                rank=e["rank"],
                user_id=e["userId"],
                username=e["username"],
                avatar=e["avatar"],
                totalXP=e["totalXP"],
                rankTier=e["rankTier"],
                goal=e.get("goal"),
            )
            for e in entries_raw
        ]
        
        # Calculate user's rank and percentile if user_id provided
        user_rank = None
        user_percentile = None
        
        if user_id:
            # Find user in entries
            for entry in entries:
                if entry.user_id == user_id:
                    user_rank = entry.rank
                    break
            
            # Calculate percentile
            user_percentile = await calculate_percentile(user_id, goal)
            print(f"[LEADERBOARD] User {user_id} rank: {user_rank}, percentile: {user_percentile}%")
        
        # Get total player count
        leaderboard_coll = get_collection("leaderboards")
        query = {"goal": goal} if goal else {}
        total_players = await leaderboard_coll.count_documents(query)
        
        return LeaderboardResponse(
            entries=entries,
            userRank=user_rank,
            userPercentile=user_percentile,
            totalPlayers=total_players,
        )
    
    except Exception as e:
        print(f"[LEADERBOARD ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/{user_id}")
async def get_user_stats(user_id: str):
    """
    Get user stats summary
    """
    try:
        users_coll = get_collection("users")
        
        # Convert string ID to ObjectId
        try:
            user_object_id = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        user = await users_coll.find_one({"_id": user_object_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        stats = user.get("stats", {})
        
        # Calculate additional metrics
        total_answers = stats.get("correctAnswers", 0) + stats.get("wrongAnswers", 0)
        accuracy = round((stats.get("correctAnswers", 0) / total_answers * 100), 1) if total_answers > 0 else 0
        
        return {
            "totalXP": stats.get("totalXP", 0),
            "rank": user.get("rank", "Bronze"),
            "currentStreak": stats.get("currentStreak", 0),
            "longestStreak": stats.get("longestStreak", 0),
            "questsCompleted": stats.get("questsCompleted", 0),
            "correctAnswers": stats.get("correctAnswers", 0),
            "wrongAnswers": stats.get("wrongAnswers", 0),
            "accuracy": accuracy,
        }
    
    except Exception as e:
        print(f"[GET STATS ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/achievements/{user_id}")
async def get_achievements(user_id: str):
    """
    Get user's earned achievements
    """
    try:
        achievements = await get_user_achievements(user_id)
        return {"achievements": achievements}
    
    except Exception as e:
        print(f"[GET ACHIEVEMENTS ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/streak/info/{user_id}")
async def get_streak_info(user_id: str):
    """
    Get streak info including freeze tokens, multiplier, and next milestone
    """
    try:
        # Check if guest user
        if user_id.startswith("guest_"):
            # Return default values for guest users
            return {
                "currentStreak": 0,
                "freezeTokens": 0,
                "freezeActive": False,
                "multiplier": 1.0,
                "nextMilestone": None,
                "milestonesReached": [],
            }
        
        users_coll = get_collection("users")
        
        # Convert string ID to ObjectId
        try:
            user_object_id = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        user = await users_coll.find_one({"_id": user_object_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_streak = user.get("stats", {}).get("currentStreak", 0)
        freeze_tokens = user.get("streakFreezes", 0)
        freeze_active = user.get("streakFreezeActive", False)
        milestones_reached = user.get("streakMilestonesReached", [])
        
        # Get current multiplier
        multiplier = get_streak_multiplier(current_streak)
        
        # Find next milestone
        from app.services.gamification import STREAK_MILESTONES
        next_milestone = None
        for days in sorted(STREAK_MILESTONES.keys()):
            if days > current_streak and days not in milestones_reached:
                next_milestone = {
                    "days": days,
                    "rewards": STREAK_MILESTONES[days]
                }
                break
        
        return {
            "currentStreak": current_streak,
            "freezeTokens": freeze_tokens,
            "freezeActive": freeze_active,
            "multiplier": multiplier,
            "nextMilestone": next_milestone,
            "milestonesReached": milestones_reached,
        }
    
    except Exception as e:
        print(f"[GET STREAK INFO ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/streak/use-freeze/{user_id}")
async def use_freeze_token(user_id: str):
    """
    Use a streak freeze token to protect streak for 24 hours
    """
    try:
        result = await use_streak_freeze(user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        print(f"[STREAK FREEZE] User {user_id} activated freeze. Tokens remaining: {result['tokensRemaining']}")
        
        return {
            "success": True,
            "tokensRemaining": result["tokensRemaining"],
            "expiresAt": result["expiresAt"],
            "message": "Streak freeze activated! Your streak is protected for 24 hours."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[USE FREEZE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily-bonus/check/{user_id}")
async def check_daily_bonus(user_id: str):
    """
    Check if user can claim daily login bonus
    """
    try:
        # Check if guest user
        if user_id.startswith("guest_"):
            # Guests can't claim daily bonuses
            return {
                "canClaim": False,
                "alreadyClaimed": False,
                "loginStreak": 0,
                "bonus": None
            }
        
        result = await check_daily_login_bonus(user_id)
        return result
    
    except Exception as e:
        print(f"[CHECK DAILY BONUS ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/daily-bonus/claim/{user_id}")
async def claim_daily_bonus(user_id: str):
    """
    Claim daily login bonus
    """
    try:
        result = await claim_daily_login_bonus(user_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to claim bonus"))
        
        print(f"[DAILY BONUS] User {user_id} claimed bonus. Streak: {result['loginStreak']}, XP: +{result['bonus'].get('xp', 0)}")
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CLAIM DAILY BONUS ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
