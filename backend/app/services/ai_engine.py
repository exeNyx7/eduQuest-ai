import json
import re
from typing import List

from groq import Groq
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class AIEngine:
    """AI Engine wrapper that talks to Groq's Llama models."""

    def __init__(self, api_key: str | None = None, model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not set. Please set it in environment variables.")
        self.client = Groq(api_key=self.api_key)
        self.model = model

    def _chat(self, system: str, user: str) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
        )
        return resp.choices[0].message.content or ""

    def generate_quiz(self, text_context: str, num_questions: int = 5, difficulty: str = "medium") -> List[dict]:
        """
        Generate a customizable MCQ quiz from the provided context.
        Returns a list of dicts with keys: question, options(list of 4), answer, explanation.
        Ensures the output is valid JSON only.
        """
        difficulty_instructions = {
            "easy": "Make questions straightforward with obvious answers. Focus on basic facts and definitions.",
            "medium": "Create moderately challenging questions that require understanding of concepts.",
            "hard": "Design advanced questions that require deep analysis, critical thinking, and application of knowledge."
        }
        
        system_prompt = (
            f"You are EduQuest's Quizmaster. Create a concise, accurate {num_questions}-question multiple-choice quiz. "
            f"Difficulty level: {difficulty.upper()}. {difficulty_instructions.get(difficulty, '')} "
            "Output JSON ONLY, no preamble, markdown, or code fences. "
            "Schema: [{\"question\": str, \"options\": [str,str,str,str], \"answer\": str, \"explanation\": str}]. "
            "Ensure exactly 4 options per question and the answer matches one of the options. "
            "IMPORTANT: Avoid using backslashes in your response. Use forward slashes instead."
        )
        user_prompt = (
            f"Context to base {num_questions} {difficulty}-level questions on:\n\n" + text_context.strip() + "\n\n"
            "Return ONLY a JSON array as specified. Do not use backslashes (\\) in any text."
        )
        raw = self._chat(system_prompt, user_prompt)
        print(f"[AI_ENGINE] Raw response length: {len(raw)} chars")

        # Some providers may wrap JSON with text; extract JSON array safely
        json_text = self._extract_json_array(raw)
        print(f"[AI_ENGINE] Extracted JSON length: {len(json_text)} chars")
        
        # Fix common invalid escape sequences before parsing
        json_text = self._fix_json_escapes(json_text)
        print(f"[AI_ENGINE] Fixed JSON, attempting to parse...")
        
        try:
            items = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"[AI_ENGINE ERROR] JSON parsing failed: {str(e)}")
            print(f"[AI_ENGINE ERROR] Problematic JSON snippet (first 500 chars):")
            print(json_text[:500])
            print(f"[AI_ENGINE ERROR] Last 200 chars:")
            print(json_text[-200:])
            raise

        # Basic validation
        if not isinstance(items, list):
            raise ValueError("Model did not return a JSON list")
        for i, it in enumerate(items):
            if not all(k in it for k in ("question", "options", "answer", "explanation")):
                raise ValueError(f"Item {i} missing required keys")
            if not isinstance(it["options"], list) or len(it["options"]) != 4:
                raise ValueError(f"Item {i} must have exactly 4 options")
            if it["answer"] not in it["options"]:
                raise ValueError(f"Item {i} answer must be one of the options")
        return items

    def generate_flashcards(self, text_context: str, topic: str = "", num_cards: int = 10, difficulty: str = "medium") -> List[dict]:
        """
        Generate flashcards from provided context or topic.
        Returns a list of dicts with keys: front, back, difficulty.
        """
        difficulty_instructions = {
            "easy": "Create simple, straightforward flashcards focusing on basic facts and definitions.",
            "medium": "Create moderately challenging flashcards that test understanding of concepts.",
            "hard": "Create advanced flashcards requiring deep analysis and critical thinking."
        }
        
        if topic and not text_context:
            # Generate from topic only
            system_prompt = (
                f"You are EduQuest's Flashcard Master. Create {num_cards} high-quality educational flashcards about '{topic}'. "
                f"Difficulty: {difficulty.upper()}. {difficulty_instructions.get(difficulty, '')} "
                "Output JSON ONLY, no preamble, markdown, or code fences. "
                "Schema: [{\"front\": str, \"back\": str, \"hint\": str, \"difficulty\": str, \"tags\": [str]}]. "
                "RULES:\n"
                "1. Front: Must be a complete, clear question (minimum 8 words) or a meaningful term\n"
                "2. Back: Provide comprehensive answer with key details (minimum 15 words)\n"
                "3. Hint: Give a subtle clue without revealing the answer (minimum 5 words)\n"
                "4. Tags: Generate 2-4 relevant tags/categories for each card (e.g., ['biology', 'cells', 'exam-prep'])\n"
                "5. Avoid single-word or vague questions\n"
                "6. Each flashcard should test a distinct concept\n"
                "7. Use clear, educational language\n"
                "IMPORTANT: Avoid using backslashes in your response."
            )
            user_prompt = f"Generate {num_cards} {difficulty}-level flashcards about: {topic}\n\nReturn ONLY a JSON array."
        else:
            # Generate from provided content
            system_prompt = (
                f"You are EduQuest's Flashcard Master. Create {num_cards} high-quality educational flashcards from the content. "
                f"Difficulty: {difficulty.upper()}. {difficulty_instructions.get(difficulty, '')} "
                "Output JSON ONLY, no preamble, markdown, or code fences. "
                "Schema: [{\"front\": str, \"back\": str, \"hint\": str, \"difficulty\": str, \"tags\": [str]}]. "
                "RULES:\n"
                "1. Front: Must be a complete, clear question (minimum 8 words) or a meaningful term\n"
                "2. Back: Provide comprehensive answer with key details (minimum 15 words)\n"
                "3. Hint: Give a subtle clue without revealing the answer (minimum 5 words)\n"
                "4. Tags: Generate 2-4 relevant tags/categories for each card based on the content\n"
                "5. Extract the most important concepts from the content\n"
                "6. Avoid single-word or vague questions\n"
                "7. Each flashcard should test a distinct concept\n"
                "8. Use examples from the content when relevant\n"
                "IMPORTANT: Avoid using backslashes in your response."
            )
            user_prompt = (
                f"Content to create {num_cards} {difficulty}-level flashcards from:\n\n" + text_context.strip() + "\n\n"
                "Return ONLY a JSON array as specified."
            )
        
        raw = self._chat(system_prompt, user_prompt)
        print(f"[AI_ENGINE] Flashcards raw response length: {len(raw)} chars")
        
        json_text = self._extract_json_array(raw)
        json_text = self._fix_json_escapes(json_text)
        
        try:
            items = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"[AI_ENGINE ERROR] Flashcard JSON parsing failed: {str(e)}")
            raise
        
        # Validation
        if not isinstance(items, list):
            raise ValueError("Model did not return a JSON list")
        for i, it in enumerate(items):
            if not all(k in it for k in ("front", "back")):
                raise ValueError(f"Flashcard {i} missing required keys")
            # Add difficulty if not present
            if "difficulty" not in it:
                it["difficulty"] = difficulty
        
        return items

    def extract_topic(self, text: str) -> str:
        """Return a concise keyword or short phrase for Unsplash search."""
        system_prompt = (
            "You extract a single, concise topic keyword from text for image search. "
            "Return ONLY the keyword or short phrase (no quotes, no punctuation)."
        )
        user_prompt = f"Text:\n{text}\n\nReturn only a short keyword or phrase."
        raw = self._chat(system_prompt, user_prompt)
        return raw.strip().splitlines()[0][:60]

    @staticmethod
    def _extract_json_array(text: str) -> str:
        # Try to find the first JSON array in the text
        match = re.search(r"\[.*\]", text, flags=re.DOTALL)
        if not match:
            raise ValueError("No JSON array found in model output")
        snippet = match.group(0)
        return snippet
    
    @staticmethod
    def _fix_json_escapes(json_text: str) -> str:
        """
        Fix common invalid escape sequences in JSON strings.
        This handles cases where the AI includes backslashes that aren't valid JSON escapes.
        """
        # Valid JSON escape sequences: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
        # We need to escape any backslashes that aren't followed by these characters
        
        # First, temporarily protect valid escapes
        protected = json_text
        
        # Replace invalid escapes with their escaped versions
        # This regex finds backslashes NOT followed by valid escape characters
        invalid_escape_pattern = r'\\(?!["\\/bfnrtu])'
        protected = re.sub(invalid_escape_pattern, r'\\\\', protected)
        
        return protected
