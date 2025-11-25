import asyncio
from app.config.db import get_collection

async def test_query():
    materials_coll = get_collection("study_materials")
    user_id = "6920b3348b9f7088e4646717"
    
    print(f"Testing query for user: {user_id}")
    
    # Count documents
    count = await materials_coll.count_documents({"user_id": user_id})
    print(f"Count: {count}")
    
    # Find documents
    cursor = materials_coll.find({"user_id": user_id})
    docs = await cursor.to_list(length=10)
    print(f"Found {len(docs)} documents")
    for doc in docs:
        print(f"  - {doc.get('filename')}")

if __name__ == "__main__":
    asyncio.run(test_query())
