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

    def generate_quiz(self, text_context: str) -> List[dict]:
        """
        Generate a 5-question MCQ quiz from the provided context.
        Returns a list of dicts with keys: question, options(list of 4), answer, explanation.
        Ensures the output is valid JSON only.
        """
        system_prompt = (
            "You are EduQuest's Quizmaster. Create a concise, accurate 5-question multiple-choice quiz. "
            "Output JSON ONLY, no preamble, markdown, or code fences. "
            "Schema: [{\"question\": str, \"options\": [str,str,str,str], \"answer\": str, \"explanation\": str}]. "
            "Ensure exactly 4 options per question and the answer matches one of the options."
        )
        user_prompt = (
            "Context to base questions on:\n\n" + text_context.strip() + "\n\n"
            "Return ONLY a JSON array as specified."
        )
        raw = self._chat(system_prompt, user_prompt)

        # Some providers may wrap JSON with text; extract JSON array safely
        json_text = self._extract_json_array(raw)
        items = json.loads(json_text)

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
        # Attempt to fix common trailing commas or invalid escapes could be added here
        return snippet
