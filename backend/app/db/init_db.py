# init_db.py

from app.db.database import Base, engine
from app.models.model import User, Swipe, Match

print("Creating tables...")
Base.metadata.drop_all(bind=engine)  #  Drop existing
Base.metadata.create_all(bind=engine)  #  Recreate updated
print("Done.")
