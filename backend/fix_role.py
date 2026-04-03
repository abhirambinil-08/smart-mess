from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
client = MongoClient(os.getenv('MONGODB_URL'))
db = client[os.getenv('DB_NAME', 'smart_mess')]
db.admin_users.update_one(
    {'email': 'admin@mess.com'},
    {'$set': {'role': 'admin'}}
)
print('Role updated!')