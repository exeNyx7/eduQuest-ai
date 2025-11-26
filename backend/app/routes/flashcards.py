from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from app.services.ai_engine import AIEngine
from app.config.db import get_collection
from app.utils.file_extraction import extract_text_from_content

router = APIRouter()
ai_engine = AIEngine()


class GenerateFlashcardsRequest(BaseModel):
    """Request to generate flashcards"""
    user_id: str
    content: Optional[str] = None  # Text content from files
    topic: Optional[str] = None  # Topic name if no content
    numCards: int = Field(default=10, ge=1, le=50)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")


class FlashcardResponse(BaseModel):
    """Single flashcard"""
    id: str
    front: str
    back: str
    difficulty: str
    user_id: str
    createdAt: str
    # SM-2 algorithm fields
    nextReview: str
    interval: int  # days
    easeFactor: float
    repetitions: int


class ReviewFlashcardRequest(BaseModel):
    """Request to review a flashcard"""
    rating: str = Field(..., pattern="^(again|hard|good|easy)$")


@router.post("/generate")
async def generate_flashcards(req: GenerateFlashcardsRequest):
    """
    Generate flashcards using AI from content or topic.
    """
    flashcards_coll = get_collection("flashcards")
    
    if not req.content and not req.topic:
        raise HTTPException(status_code=400, detail="Either content or topic must be provided")
    
    try:
        # Extract text from content (handles PDF/PPTX if present)
        extracted_content = ""
        if req.content:
            extracted_content = extract_text_from_content(req.content)
            print(f"[FLASHCARDS] Extracted {len(extracted_content)} characters from content")
        
        # Generate flashcards using AI
        flashcards_data = ai_engine.generate_flashcards(
            text_context=extracted_content or "",
            topic=req.topic or "",
            num_cards=req.numCards,
            difficulty=req.difficulty
        )
        
        # Initialize SM-2 algorithm values for each card
        now = datetime.utcnow()
        inserted_flashcards = []
        
        # Generate session ID for this batch
        session_id = str(ObjectId())
        session_name = req.topic if req.topic else f"Session {now.strftime('%Y-%m-%d %H:%M')}"
        
        for card_data in flashcards_data:
            flashcard = {
                "user_id": req.user_id,
                "front": card_data["front"],
                "back": card_data["back"],
                "hint": card_data.get("hint", ""),
                "difficulty": card_data.get("difficulty", req.difficulty),
                "createdAt": now,
                "sessionId": session_id,
                "sessionName": session_name,
                # SM-2 initial values
                "nextReview": now,  # Available immediately
                "interval": 0,  # New card
                "easeFactor": 2.5,  # Default ease factor
                "repetitions": 0,  # Never reviewed
                "status": "learning",  # learning, reviewing, mastered
                # History tracking
                "reviewHistory": [],
                # New features
                "tags": card_data.get("tags", []),
                "bookmarked": False
            }
            
            # Insert card and get the ID
            result = await flashcards_coll.insert_one(flashcard)
            
            # Add to response with string ID
            inserted_flashcards.append({
                "id": str(result.inserted_id),
                "front": flashcard["front"],
                "back": flashcard["back"],
                "hint": flashcard["hint"],
                "difficulty": flashcard["difficulty"],
                "sessionName": flashcard["sessionName"],
                "createdAt": flashcard["createdAt"].isoformat(),
                "nextReview": flashcard["nextReview"].isoformat(),
                "interval": flashcard["interval"],
                "easeFactor": flashcard["easeFactor"],
                "repetitions": flashcard["repetitions"],
                "status": flashcard["status"],
                "tags": flashcard["tags"],
                "bookmarked": flashcard["bookmarked"]
            })
        
        return {
            "success": True,
            "flashcards": inserted_flashcards,
            "count": len(inserted_flashcards)
        }
    
    except Exception as e:
        print(f"[FLASHCARDS ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")


@router.get("/due/{user_id}")
async def get_due_flashcards(user_id: str):
    """
    Get all flashcards due for review for a user.
    """
    flashcards_coll = get_collection("flashcards")
    
    now = datetime.utcnow()
    
    # Find flashcards where nextReview <= now
    cursor = flashcards_coll.find({
        "user_id": user_id,
        "nextReview": {"$lte": now}
    }).sort("nextReview", 1)  # Oldest due first
    
    flashcards = []
    async for card in cursor:
        flashcards.append({
            "id": str(card["_id"]),
            "front": card["front"],
            "back": card["back"],
            "hint": card.get("hint", ""),
            "difficulty": card["difficulty"],
            "nextReview": card["nextReview"].isoformat(),
            "interval": card["interval"],
            "easeFactor": card["easeFactor"],
            "repetitions": card["repetitions"],
            "status": card.get("status", "learning"),
            "sessionId": card.get("sessionId", ""),
            "sessionName": card.get("sessionName", ""),
            "tags": card.get("tags", []),
            "bookmarked": card.get("bookmarked", False)
        })
    
    return {
        "flashcards": flashcards,
        "count": len(flashcards)
    }


@router.get("/session/{session_id}/cards")
async def get_session_cards(session_id: str):
    """
    Get all flashcards for a specific session (for session-based review).
    """
    flashcards_coll = get_collection("flashcards")
    
    cursor = flashcards_coll.find({
        "sessionId": session_id
    }).sort("createdAt", 1)
    
    flashcards = []
    async for card in cursor:
        flashcards.append({
            "id": str(card["_id"]),
            "front": card["front"],
            "back": card["back"],
            "hint": card.get("hint", ""),
            "difficulty": card["difficulty"],
            "nextReview": card["nextReview"].isoformat(),
            "interval": card["interval"],
            "easeFactor": card["easeFactor"],
            "repetitions": card["repetitions"],
            "status": card.get("status", "learning"),
            "sessionId": card.get("sessionId", ""),
            "sessionName": card.get("sessionName", ""),
            "tags": card.get("tags", []),
            "bookmarked": card.get("bookmarked", False)
        })
    
    return {
        "flashcards": flashcards,
        "count": len(flashcards)
    }


@router.get("/all/{user_id}")
async def get_all_flashcards(user_id: str, status: Optional[str] = None):
    """
    Get all flashcards for a user, optionally filtered by status.
    """
    flashcards_coll = get_collection("flashcards")
    
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    
    cursor = flashcards_coll.find(query).sort("createdAt", -1)
    
    flashcards = []
    async for card in cursor:
        flashcards.append({
            "id": str(card["_id"]),
            "front": card["front"],
            "back": card["back"],
            "hint": card.get("hint", ""),
            "difficulty": card["difficulty"],
            "createdAt": card["createdAt"].isoformat(),
            "nextReview": card["nextReview"].isoformat(),
            "interval": card["interval"],
            "easeFactor": card["easeFactor"],
            "repetitions": card["repetitions"],
            "status": card.get("status", "learning"),
            "sessionId": card.get("sessionId", ""),
            "sessionName": card.get("sessionName", ""),
            "tags": card.get("tags", []),
            "bookmarked": card.get("bookmarked", False)
        })
    
    return {
        "flashcards": flashcards,
        "count": len(flashcards)
    }


@router.get("/{flashcard_id}")
async def get_flashcard_by_id(flashcard_id: str):
    """
    Debug: Fetch a single flashcard by ID.
    """
    flashcards_coll = get_collection("flashcards")
    try:
        card = await flashcards_coll.find_one({"_id": ObjectId(flashcard_id)})
    except Exception as e:
        print(f"[FLASHCARDS] Invalid ObjectId for get: {flashcard_id} error={e}")
        raise HTTPException(status_code=400, detail="Invalid flashcard ID")

    if not card:
        print(f"[FLASHCARDS] Flashcard not found: {flashcard_id}")
        raise HTTPException(status_code=404, detail="Flashcard not found")

    return {
        "id": str(card["_id"]),
        "front": card["front"],
        "back": card["back"],
        "userId": card.get("user_id", ""),
        "sessionId": card.get("sessionId", ""),
        "nextReview": card["nextReview"].isoformat(),
    }

@router.post("/{flashcard_id}/review")
async def review_flashcard(flashcard_id: str, req: ReviewFlashcardRequest):
    """
    Review a flashcard and update using SM-2 algorithm.
    Rating: again (0), hard (3), good (4), easy (5)
    """
    flashcards_coll = get_collection("flashcards")
    
    # Get the flashcard
    try:
        card = await flashcards_coll.find_one({"_id": ObjectId(flashcard_id)})
    except Exception as e:
        print(f"[FLASHCARDS] Invalid ObjectId for review: {flashcard_id} error={e}")
        raise HTTPException(status_code=400, detail="Invalid flashcard ID")
    
    if not card:
        print(f"[FLASHCARDS] Review target not found: {flashcard_id}")
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    # SM-2 Algorithm Implementation
    ease_factor = card["easeFactor"]
    interval = card["interval"]
    repetitions = card["repetitions"]
    
    # Convert rating to quality (0-5)
    quality_map = {
        "again": 0,  # Complete fail, restart
        "hard": 3,   # Correct with difficulty
        "good": 4,   # Correct with some effort
        "easy": 5    # Perfect recall
    }
    quality = quality_map[req.rating]
    
    # SM-2 calculations
    if quality < 3:
        # Failed: reset repetitions and interval
        repetitions = 0
        interval = 0
        status = "learning"
    else:
        # Passed: update based on quality
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
        
        repetitions += 1
        
        # Update ease factor
        ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        
        # Ease factor should be at least 1.3
        if ease_factor < 1.3:
            ease_factor = 1.3
        
        # Update status based on interval
        if interval >= 21:
            status = "mastered"
        elif interval >= 1:
            status = "reviewing"
        else:
            status = "learning"
    
    # Calculate next review date
    next_review = datetime.utcnow() + timedelta(days=interval)
    
    # Create review history entry
    review_entry = {
        "timestamp": datetime.utcnow(),
        "quality": quality,
        "interval": interval,
        "easeFactor": ease_factor
    }
    
    # Update the flashcard
    await flashcards_coll.update_one(
        {"_id": ObjectId(flashcard_id)},
        {
            "$set": {
                "easeFactor": ease_factor,
                "interval": interval,
                "repetitions": repetitions,
                "nextReview": next_review,
                "lastReviewed": datetime.utcnow(),
                "status": status
            },
            "$push": {
                "reviewHistory": review_entry
            }
        }
    )
    
    return {
        "success": True,
        "flashcard": {
            "id": flashcard_id,
            "interval": interval,
            "nextReview": next_review.isoformat(),
            "easeFactor": ease_factor,
            "repetitions": repetitions,
            "status": status
        }
    }


@router.delete("/{flashcard_id}")
async def delete_flashcard(flashcard_id: str, user_id: str):
    """
    Delete a flashcard.
    """
    flashcards_coll = get_collection("flashcards")
    
    try:
        result = await flashcards_coll.delete_one({
            "_id": ObjectId(flashcard_id),
            "user_id": user_id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid flashcard ID")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    return {"success": True, "message": "Flashcard deleted"}


@router.post("/{flashcard_id}/bookmark")
async def toggle_bookmark(flashcard_id: str, user_id: str):
    """
    Toggle bookmark status for a flashcard.
    """
    flashcards_coll = get_collection("flashcards")
    
    try:
        card = await flashcards_coll.find_one({
            "_id": ObjectId(flashcard_id),
            "user_id": user_id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid flashcard ID")
    
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    new_bookmark_status = not card.get("bookmarked", False)
    
    await flashcards_coll.update_one(
        {"_id": ObjectId(flashcard_id)},
        {"$set": {"bookmarked": new_bookmark_status}}
    )
    
    return {
        "success": True,
        "bookmarked": new_bookmark_status
    }


@router.get("/stats/{user_id}")
async def get_flashcard_stats(user_id: str):
    """
    Get flashcard statistics for a user.
    """
    flashcards_coll = get_collection("flashcards")
    
    # Count by status
    total = await flashcards_coll.count_documents({"user_id": user_id})
    learning = await flashcards_coll.count_documents({"user_id": user_id, "status": "learning"})
    reviewing = await flashcards_coll.count_documents({"user_id": user_id, "status": "reviewing"})
    mastered = await flashcards_coll.count_documents({"user_id": user_id, "status": "mastered"})
    
    # Count due today
    now = datetime.utcnow()
    due_now = await flashcards_coll.count_documents({
        "user_id": user_id,
        "nextReview": {"$lte": now}
    })
    
    return {
        "total": total,
        "learning": learning,
        "reviewing": reviewing,
        "mastered": mastered,
        "dueToday": due_now
    }


@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str):
    """
    Get all unique flashcard sessions for a user.
    """
    flashcards_coll = get_collection("flashcards")
    
    # Get distinct sessions using aggregation
    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": "$sessionId",
                "sessionName": {"$first": "$sessionName"},
                "count": {"$sum": 1},
                "createdAt": {"$min": "$createdAt"}
            }
        },
        {"$sort": {"createdAt": -1}}
    ]
    
    sessions = await flashcards_coll.aggregate(pipeline).to_list(length=None)
    
    # Format response
    result = []
    for session in sessions:
        result.append({
            "id": session["_id"],
            "name": session["sessionName"],
            "count": session["count"],
            "createdAt": session["createdAt"].isoformat() if session["createdAt"] else None
        })
    
    return {"sessions": result}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str = Query(...)):
    """
    Delete all flashcards in a session.
    Requires user_id as query parameter for security.
    """
    flashcards_coll = get_collection("flashcards")
    
    result = await flashcards_coll.delete_many({
        "sessionId": session_id,
        "user_id": user_id
    })
    
    return {
        "success": True,
        "message": f"Deleted {result.deleted_count} flashcards",
        "deletedCount": result.deleted_count
    }


@router.get("/history/{user_id}")
async def get_review_history(user_id: str, limit: int = 100):
    """
    Get review history for a user with performance stats.
    """
    flashcards_coll = get_collection("flashcards")
    
    # Get all flashcards with review history
    flashcards = await flashcards_coll.find({
        "user_id": user_id,
        "reviewHistory": {"$exists": True, "$ne": []}
    }).to_list(length=None)
    
    # Flatten all review history entries
    all_reviews = []
    for card in flashcards:
        for review in card.get("reviewHistory", []):
            all_reviews.append({
                "flashcardId": str(card["_id"]),
                "front": card["front"],
                "back": card["back"],
                "timestamp": review["timestamp"],
                "quality": review["quality"],
                "interval": review["interval"],
                "easeFactor": review["easeFactor"]
            })
    
    # Sort by timestamp descending and limit
    all_reviews.sort(key=lambda x: x["timestamp"], reverse=True)
    all_reviews = all_reviews[:limit]
    
    # Calculate stats
    total_reviews = len(all_reviews)
    if total_reviews > 0:
        avg_quality = sum(r["quality"] for r in all_reviews) / total_reviews
        quality_distribution = {
            "again": sum(1 for r in all_reviews if r["quality"] == 1),
            "hard": sum(1 for r in all_reviews if r["quality"] == 2),
            "good": sum(1 for r in all_reviews if r["quality"] == 3),
            "easy": sum(1 for r in all_reviews if r["quality"] == 4)
        }
    else:
        avg_quality = 0
        quality_distribution = {"again": 0, "hard": 0, "good": 0, "easy": 0}
    
    # Format timestamps for JSON
    for review in all_reviews:
        review["timestamp"] = review["timestamp"].isoformat()
    
    return {
        "reviews": all_reviews,
        "stats": {
            "totalReviews": total_reviews,
            "averageQuality": round(avg_quality, 2),
            "qualityDistribution": quality_distribution
        }
    }
