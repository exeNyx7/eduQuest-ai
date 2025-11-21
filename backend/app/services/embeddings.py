from functools import lru_cache
from typing import List

try:
    from sentence_transformers import SentenceTransformer
except ImportError:  # pragma: no cover
    SentenceTransformer = None  # type: ignore

MODEL_NAME = "all-MiniLM-L6-v2"

@lru_cache(maxsize=1)
def get_model():
    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers not installed. Add to requirements and install.")
    return SentenceTransformer(MODEL_NAME)

def embed_texts(texts: List[str]) -> List[List[float]]:
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    return [emb.tolist() for emb in embeddings]

def embed_text(text: str) -> List[float]:
    return embed_texts([text])[0]