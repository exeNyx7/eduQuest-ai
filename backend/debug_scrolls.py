from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['eduquest']
coll = db['study_materials']

user_id = '69271c5dea1f7833187f189f'
docs = list(coll.find({'user_id': user_id}))

print(f'\n=== STUDY MATERIALS DEBUG ===')
print(f'Total documents for user {user_id}: {len(docs)}')
print(f'\nAll user_id values in collection:')
all_docs = list(coll.find({}, {'user_id': 1, 'filename': 1}).limit(10))
for doc in all_docs:
    print(f"  - {doc.get('filename')}: user_id='{doc.get('user_id')}' (type: {type(doc.get('user_id'))})")

print(f'\nDocuments for our user:')
for doc in docs:
    print(f"  - {doc.get('filename')}")
    print(f"    user_id: '{doc.get('user_id')}'")
    print(f"    _id: {doc.get('_id')}")
