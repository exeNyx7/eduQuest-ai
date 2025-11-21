from fastapi import APIRouter, HTTPException
from typing import Optional

from app.models.user_schemas import (
    QuizResultRequest,
    QuizResultResponse,
    LeaderboardResponse,
    LeaderboardEntry,
    UpdateStatsRequest,
    UpdateStatsResponse,
    User,
)
from app.services.gamification import (
    calculate_xp,
    update_user_xp,
    update_streak,
    get_leaderboard,
    calculate_percentile,
)
from app.config.db import get_collection

router = APIRouter(tags=["user"])

@router.post("/submit-quiz", response_model=QuizResultResponse)
async def submit_quiz_result(req: QuizResultRequest):
    """
    Submit quiz results and update user stats/XP
    """
    try:
        print(f"[QUIZ SUBMIT] User {req.userId} completed quiz - Score: {req.score}/{req.totalQuestions}")
        
        # Calculate XP
        users_coll = get_collection("users")
        user = await users_coll.find_one({"_id": req.userId})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_streak = user.get("stats", {}).get("currentStreak", 0)
        xp_earned, breakdown = calculate_xp(
            req.correctAnswers,
            current_streak,
            req.perfectScore
        )
        
        print(f"[QUIZ SUBMIT] XP Earned: {xp_earned} (Base: {breakdown['base']}, Streak: {breakdown['streak_bonus']}, Perfect: {breakdown['perfect_bonus']})")
        
        # Update XP and rank
        xp_result = await update_user_xp(req.userId, xp_earned)
        
        # Update answer counts
        await users_coll.update_one(
            {"_id": req.userId},
            {
                "$inc": {
                    "stats.correctAnswers": req.correctAnswers,
                    "stats.wrongAnswers": req.wrongAnswers,
                    "stats.questsCompleted": 1,
                }
            }
        )
        
        # Update streak (only if user got > 50%)
        if req.score >= 50:
            new_streak = await update_streak(req.userId, increment=True)
            print(f"[QUIZ SUBMIT] Streak updated: {new_streak}")
        
        # TODO: Check and update daily quests
        quests_completed = []
        
        print(f"[QUIZ SUBMIT] ✅ Success! New XP: {xp_result['newXP']}, Rank: {xp_result['newRank']}")
        
        return QuizResultResponse(
            xpEarned=xp_earned,
            breakdown=breakdown,
            newTotalXP=xp_result["newXP"],
            newRank=xp_result["newRank"],
            rankedUp=xp_result["rankedUp"],
            questsCompleted=quests_completed,
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
        user = await users_coll.find_one({"_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
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
                userId=e["userId"],
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
                if entry.userId == user_id:
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
        user = await users_coll.find_one({"_id": user_id})
        
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
