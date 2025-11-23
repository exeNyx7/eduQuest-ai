"""
Password Reset Routes
Handles password reset request and password update functionality
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import secrets
import hashlib
from app.config.db import get_db
import bcrypt

router = APIRouter()

class RequestResetRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str

class ResetResponse(BaseModel):
    success: bool
    message: str


def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash the token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/request-reset", response_model=ResetResponse)
async def request_password_reset(request: RequestResetRequest):
    """
    Request a password reset email.
    Generates a token and stores it in the database.
    
    Note: In production, this should send an email with the reset link.
    For now, it returns the token in the response for testing.
    """
    try:
        db = get_db()
        users_coll = db.users
        tokens_coll = db.password_reset_tokens
        
        # Check if user exists
        user = await users_coll.find_one({"email": request.email})
        
        # Always return success to prevent email enumeration attacks
        # But only actually create a token if user exists
        if user:
            # Generate reset token
            token = generate_reset_token()
            token_hash = hash_token(token)
            
            # Store token with expiry (1 hour)
            expiry = datetime.utcnow() + timedelta(hours=1)
            
            await tokens_coll.update_one(
                {"userId": str(user["_id"])},
                {
                    "$set": {
                        "tokenHash": token_hash,
                        "email": request.email,
                        "expiresAt": expiry,
                        "createdAt": datetime.utcnow(),
                        "used": False,
                    }
                },
                upsert=True,
            )
            
            # TODO: Send email with reset link
            # For now, return token in response for testing
            reset_link = f"http://localhost:3000/auth/reset-password?token={token}"
            
            print(f"[PASSWORD RESET] Token generated for {request.email}")
            print(f"[PASSWORD RESET] Reset link: {reset_link}")
            
            return ResetResponse(
                success=True,
                message=f"Password reset instructions have been sent to {request.email}. Check console for reset link (development mode)."
            )
        else:
            # User doesn't exist, but we still return success
            # to prevent email enumeration
            print(f"[PASSWORD RESET] Reset requested for non-existent email: {request.email}")
            
            return ResetResponse(
                success=True,
                message=f"If an account exists for {request.email}, you will receive password reset instructions."
            )
            
    except Exception as e:
        print(f"Error requesting password reset: {e}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")


@router.post("/reset-password", response_model=ResetResponse)
async def reset_password(request: ResetPasswordRequest):
    """
    Reset password using a valid token.
    Validates the token and updates the user's password.
    """
    try:
        db = get_db()
        users_coll = db.users
        tokens_coll = db.password_reset_tokens
        
        # Hash the provided token to compare with stored hash
        token_hash = hash_token(request.token)
        
        # Find the token
        token_doc = await tokens_coll.find_one({"tokenHash": token_hash})
        
        if not token_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        # Check if token is expired
        if token_doc["expiresAt"] < datetime.utcnow():
            # Clean up expired token
            await tokens_coll.delete_one({"_id": token_doc["_id"]})
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")
        
        # Check if token was already used
        if token_doc.get("used", False):
            raise HTTPException(status_code=400, detail="This reset token has already been used")
        
        # Validate new password
        if len(request.newPassword) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
        # Hash the new password
        password_hash = bcrypt.hashpw(request.newPassword.encode(), bcrypt.gensalt())
        
        # Update user's password
        from bson import ObjectId
        user_id = ObjectId(token_doc["userId"])
        
        result = await users_coll.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "password": password_hash.decode(),
                    "updatedAt": datetime.utcnow(),
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mark token as used
        await tokens_coll.update_one(
            {"_id": token_doc["_id"]},
            {"$set": {"used": True, "usedAt": datetime.utcnow()}}
        )
        
        print(f"[PASSWORD RESET] Password successfully reset for user {token_doc['userId']}")
        
        return ResetResponse(
            success=True,
            message="Your password has been successfully reset. You can now log in with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")


@router.delete("/cleanup-expired-tokens")
async def cleanup_expired_tokens():
    """
    Clean up expired password reset tokens.
    This should be called periodically (e.g., via a cron job).
    """
    try:
        db = get_db()
        tokens_coll = db.password_reset_tokens
        
        result = await tokens_coll.delete_many({
            "expiresAt": {"$lt": datetime.utcnow()}
        })
        
        return {
            "success": True,
            "deletedCount": result.deleted_count,
            "message": f"Cleaned up {result.deleted_count} expired tokens"
        }
        
    except Exception as e:
        print(f"Error cleaning up tokens: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup expired tokens")
