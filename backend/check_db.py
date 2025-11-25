from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
print('Databases:', client.list_database_names())

db = client['eduquest']
print(f'\nCollections in eduquest: {db.list_collection_names()}')
print(f'study_materials count: {db.study_materials.count_documents({})}')

docs = list(db.study_materials.find().limit(3))
print(f'\nFound {len(docs)} documents')
for doc in docs:
    print(f"  - user_id: {doc.get('user_id')}, filename: {doc.get('filename')}, scroll_id: {doc.get('scroll_id')}")

# Check all user_ids in study_materials
all_user_ids = db.study_materials.distinct('user_id')
print(f'\nUnique user_ids in study_materials: {all_user_ids}')
