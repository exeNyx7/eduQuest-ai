import math
import uuid
from typing import List, Dict

from app.config.db import get_collection
from app.services.embeddings import embed_texts, embed_text

DOCS_COLLECTION = "documents"

def _chunk_text(text: str, max_chars: int = 500) -> List[str]:
    words = text.split()
    chunks = []
    current = []
    length = 0
    for w in words:
        if length + len(w) + 1 > max_chars:
            chunks.append(" ".join(current))
            current = [w]
            length = len(w) + 1
        else:
            current.append(w)
            length += len(w) + 1
    if current:
        chunks.append(" ".join(current))
    return chunks

async def store_content(user_id: str, text: str) -> str:
    print(f"[VECTOR_STORE] Starting store_content for user: {user_id}")
    print(f"[VECTOR_STORE] Text length: {len(text)} chars")
    
    chunks = _chunk_text(text)
    print(f"[VECTOR_STORE] Created {len(chunks)} chunks")
    
    embeddings = embed_texts(chunks)
    print(f"[VECTOR_STORE] Generated {len(embeddings)} embeddings")
    
    content_id = str(uuid.uuid4())
    print(f"[VECTOR_STORE] Generated content_id: {content_id}")
    
    coll = get_collection(DOCS_COLLECTION)
    docs = [
        {
            "_id": f"{content_id}:{i}",
            "content_id": content_id,
            "user_id": user_id,
            "chunk_index": i,
            "text": chunk,
            "embedding": emb,
        }
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]
    
    print(f"[VECTOR_STORE] Inserting {len(docs)} documents into MongoDB...")
    result = await coll.insert_many(docs)
    print(f"[VECTOR_STORE] ✅ Inserted {len(result.inserted_ids)} documents successfully!")
    
    return content_id

def _cosine(a: List[float], b: List[float]) -> float:
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(y*y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)

async def retrieve_context(query: str, content_id: str, limit: int = 3) -> List[Dict]:
    coll = get_collection(DOCS_COLLECTION)
    cursor = coll.find({"content_id": content_id})
    docs = await cursor.to_list(length=1000)
    if not docs:
        return []
    q_emb = embed_text(query)
    scored = [
        {"text": d["text"], "score": _cosine(q_emb, d["embedding"])}
        for d in docs
    ]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]