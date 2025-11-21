import os
from motor.motor_asyncio import AsyncIOMotorClient
from functools import lru_cache
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

MONGO_URI_ENV = "MONGO_URI"
DB_NAME = os.getenv("MONGO_DB_NAME", "eduquest")

@lru_cache(maxsize=1)
def get_client() -> AsyncIOMotorClient:
    uri = os.getenv(MONGO_URI_ENV)
    if not uri:
        raise RuntimeError(f"{MONGO_URI_ENV} not set")
    return AsyncIOMotorClient(uri)

def get_db():
    return get_client()[DB_NAME]

def get_collection(name: str):
    return get_db()[name]