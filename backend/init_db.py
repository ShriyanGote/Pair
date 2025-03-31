from database import Base, engine
from model import User

print("Creating tables...")
Base.metadata.drop_all(bind=engine)  # 💥 Drop existing
Base.metadata.create_all(bind=engine)  # ✅ Recreate updated
print("Done.")
