from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import traceback

from app.models.schemas import GenerateQuizRequest, GenerateQuizResponse, QuizItem
from app.services.ai_engine import AIEngine

router = APIRouter(tags=["quiz"])


@router.post("/generate-quiz", response_model=GenerateQuizResponse)
async def generate_quiz(req: GenerateQuizRequest):
    try:
        print(f"[QUIZ] Received text length: {len(req.text_context)} chars")
        print(f"[QUIZ] Parameters: {req.num_questions} questions, difficulty: {req.difficulty}")
        engine = AIEngine(api_key=os.getenv("GROQ_API_KEY"))
        print(f"[QUIZ] AIEngine initialized, generating quiz...")
        items = engine.generate_quiz(req.text_context, req.num_questions, req.difficulty)
        print(f"[QUIZ] Generated {len(items)} quiz items")
        topic = engine.extract_topic(req.text_context)
        print(f"[QUIZ] Extracted topic: {topic}")
        quiz_items = [QuizItem(**it) for it in items]
        print(f"[QUIZ] ✅ Quiz generation successful!")
        return GenerateQuizResponse(topic=topic, items=quiz_items)
    except json.JSONDecodeError as e:
        print(f"[QUIZ ERROR] JSONDecodeError: {str(e)}")
        print(f"[QUIZ ERROR] This usually means the AI generated invalid JSON with escape sequences.")
        print(f"[QUIZ ERROR] The fix has been applied. Please try generating the quiz again.")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Failed to parse quiz JSON. Please try again.")
    except Exception as e:
        print(f"[QUIZ ERROR] {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
