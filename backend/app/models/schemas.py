from pydantic import BaseModel, Field
from typing import List

class GenerateQuizRequest(BaseModel):
    text_context: str = Field(..., min_length=1, description="Source text to generate quiz from")
    num_questions: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")
    difficulty: str = Field(default="medium", description="Difficulty level: easy, medium, hard")

class QuizItem(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str

class GenerateQuizResponse(BaseModel):
    topic: str
    items: List[QuizItem]

class UploadRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=20, description="Raw study content to store")

class UploadResponse(BaseModel):
    content_id: str
    chunks: int

class AskTutorRequest(BaseModel):
    user_id: str
    content_id: str
    question: str
    user_answer: str | None = None
    query: str = Field(..., description="Query for retrieving context (could be question or user follow-up)")

class AskTutorResponse(BaseModel):
    explanation: str
    context_snippets: List[str]
