from fastapi import APIRouter, HTTPException
import os

from app.models.schemas import (
    UploadRequest,
    UploadResponse,
    AskTutorRequest,
    AskTutorResponse,
)
from app.services.vector_store import store_content, retrieve_context
from app.services.ai_engine import AIEngine

router = APIRouter(tags=["content"])

@router.post("/upload", response_model=UploadResponse)
async def upload_content(req: UploadRequest):
    try:
        print(f"[UPLOAD] Received text length: {len(req.text)} chars from user: {req.user_id}")
        content_id = await store_content(req.user_id, req.text)
        # Estimate number of chunks by counting inserted docs from text splitting
        chunks = len(req.text.split()) // 100  # rough estimate; refined retrieval uses DB
        print(f"[UPLOAD] Success! content_id: {content_id}, chunks: {max(chunks, 1)}")
        return UploadResponse(content_id=content_id, chunks=max(chunks, 1))
    except Exception as e:
        print(f"[UPLOAD ERROR] {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/ask-tutor", response_model=AskTutorResponse)
async def ask_tutor(req: AskTutorRequest):
    try:
        context_docs = await retrieve_context(req.query, req.content_id)
        context_texts = [d["text"] for d in context_docs]
        joined = "\n".join(context_texts)
        engine = AIEngine(api_key=os.getenv("GROQ_API_KEY"))
        system_prompt = (
            "You are the EduQuest Tutor Wizard. Use provided context to explain the answer clearly, step-by-step. "
            "If user_answer is provided and is incorrect, first acknowledge attempt, then correct."
        )
        user_message = (
            f"Question: {req.question}\nUser Answer: {req.user_answer}\nQuery: {req.query}\nContext:\n{joined}\n"
            "Explain succinctly but helpfully."
        )
        explanation = engine._chat(system_prompt, user_message)
        return AskTutorResponse(explanation=explanation.strip(), context_snippets=context_texts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))