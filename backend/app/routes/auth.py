"""
Authentication endpoints for email/password auth
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import bcrypt
from bson import ObjectId

from app.config.db import get_db

router = APIRouter()


# ============ SCHEMAS ============
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)
    age: int = Field(..., ge=13)


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Username or email")
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    username: str
    email: str
    image: str
    profile: dict
    stats: dict
    rank: str
    createdAt: str


# ============ HELPER FUNCTIONS ============
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_default_user_document(
    name: str, username: str, email: str, hashed_password: str, age: int
) -> dict:
    """Create a default user document with all required fields"""
    return {
        "name": name,
        "username": username.lower(),
        "email": email.lower(),
        "password": hashed_password,
        "age": age,
        "image": f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
        "profile": {
            "goal": None,
            "subjects": [],
            "powerLevel": "Novice",
        },
        "stats": {
            "totalXP": 0,
            "currentStreak": 0,
            "longestStreak": 0,
            "questsCompleted": 0,
            "correctAnswers": 0,
            "wrongAnswers": 0,
        },
        "rank": "Bronze",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }


# ============ ROUTES ============
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(req: RegisterRequest):
    """
    Register a new user with email/password
    """
    db = get_db()
    users_col = db["users"]

    # Check if username already exists
    existing_username = await users_col.find_one({"username": req.username.lower()})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Check if email already exists
    existing_email = await users_col.find_one({"email": req.email.lower()})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash password
    hashed_password = hash_password(req.password)

    # Create user document
    user_doc = create_default_user_document(
        name=req.name,
        username=req.username,
        email=req.email,
        hashed_password=hashed_password,
        age=req.age,
    )

    # Insert into database
    result = await users_col.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    print(f"[AUTH] New user registered: {req.username} ({req.email})")

    # Return user response (without password)
    return UserResponse(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        username=user_doc["username"],
        email=user_doc["email"],
        image=user_doc["image"],
        profile=user_doc["profile"],
        stats=user_doc["stats"],
        rank=user_doc["rank"],
        createdAt=user_doc["createdAt"].isoformat(),
    )


@router.post("/login", response_model=UserResponse)
async def login_user(req: LoginRequest):
    """
    Login with username/email and password
    """
    db = get_db()
    users_col = db["users"]

    # Find user by username or email
    identifier = req.identifier.lower()
    user = await users_col.find_one({
        "$or": [
            {"username": identifier},
            {"email": identifier},
        ]
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
        )

    # Verify password
    if not verify_password(req.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
        )

    print(f"[AUTH] User logged in: {user['username']}")

    # Return user response (without password)
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        username=user["username"],
        email=user["email"],
        image=user["image"],
        profile=user.get("profile", {"goal": None, "subjects": [], "powerLevel": "Novice"}),
        stats=user.get("stats", {
            "totalXP": 0,
            "currentStreak": 0,
            "longestStreak": 0,
            "questsCompleted": 0,
            "correctAnswers": 0,
            "wrongAnswers": 0,
        }),
        rank=user.get("rank", "Bronze"),
        createdAt=user.get("createdAt", datetime.utcnow()).isoformat(),
    )
