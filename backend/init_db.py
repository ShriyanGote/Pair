# init_db.py
from database import Base, engine
from model import User  # or from models if you named the file differently

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
