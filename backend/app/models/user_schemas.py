from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# User Profile Models
class UserProfile(BaseModel):
    goal: Optional[str] = Field(None, description="SAT, GRE, STEM, or General")
    subjects: List[str] = Field(default_factory=list, description="Selected subjects")
    powerLevel: str = Field("Novice", description="Novice, Apprentice, Adept, Expert")

class UserStats(BaseModel):
    totalXP: int = Field(0, description="Total experience points earned")
    currentStreak: int = Field(0, description="Current day streak")
    longestStreak: int = Field(0, description="Longest streak achieved")
    questsCompleted: int = Field(0, description="Total quests completed")
    correctAnswers: int = Field(0, description="Total correct answers")
    wrongAnswers: int = Field(0, description="Total wrong answers")

class User(BaseModel):
    id: str
    email: str
    name: str
    image: Optional[str] = None
    profile: UserProfile = Field(default_factory=UserProfile)
    stats: UserStats = Field(default_factory=UserStats)
    rank: str = Field("Bronze", description="Current rank tier")
    createdAt: Optional[datetime] = None
    lastActive: Optional[datetime] = None

# Daily Quest Models
class Quest(BaseModel):
    id: str
    title: str
    description: str
    progress: int = 0
    target: int
    completed: bool = False
    xpReward: int

class DailyQuests(BaseModel):
    user_id: str
    date: datetime
    quests: List[Quest]

# Leaderboard Models
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    avatar: str
    totalXP: int
    rankTier: str
    goal: Optional[str] = None

class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    userRank: Optional[int] = None
    userPercentile: Optional[float] = None
    totalPlayers: int

# API Request/Response Models
class UpdateStatsRequest(BaseModel):
    user_id: str
    correctAnswers: int
    wrongAnswers: int
    streakIncrement: int = 0

class UpdateStatsResponse(BaseModel):
    newXP: int
    xpGained: int
    newRank: str
    rankedUp: bool
    newStreak: int
    questsUpdated: List[str] = Field(default_factory=list)

class QuizResultRequest(BaseModel):
    user_id: str
    quizId: str
    score: int
    totalQuestions: int
    correctAnswers: int
    wrongAnswers: int
    perfectScore: bool = False
    timeBonus: Optional[int] = Field(0, description="Bonus XP for fast completion")

class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    xpReward: int
    unlockedAt: Optional[datetime] = None

class StreakMilestone(BaseModel):
    days: int
    freezeTokens: int
    bonusXP: int

class QuizResultResponse(BaseModel):
    xpEarned: int
    breakdown: dict = Field(default_factory=dict)
    newTotalXP: int
    newRank: str
    rankedUp: bool
    questsCompleted: List[str] = Field(default_factory=list)
    achievementsUnlocked: List[Achievement] = Field(default_factory=list)
    streakMilestone: Optional[StreakMilestone] = None
    streakMultiplier: float = 1.0

class DailyQuestsData(BaseModel):
    user_id: str
    daily_quests: List[Quest]
    last_updated: str

class WeeklyQuestsData(BaseModel):
    user_id: str
    weekly_quests: List[Quest]
    last_updated: str

class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    level: int
    xp: int
    xp_to_next_level: int
    power_level: float
    preferred_difficulty: str
    created_at: str
    last_seen: str
    user_id: str

class UserStats(BaseModel):
    level: int
    xp: int
    xp_to_next_level: int
    power_level: float

class UpdateStatsRequest(BaseModel):
    user_id: str
    xp_earned: Optional[int] = 0
    quizzes_completed: Optional[int] = 0
    flashcards_reviewed: Optional[int] = 0
    time_spent: Optional[int] = 0 # in seconds

class LeaderboardUser(BaseModel):
    user_id: str
    username: str
    level: int
    xp: int
