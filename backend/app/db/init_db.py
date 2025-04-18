from app.db.database import Base, engine
from app.models.model import (
    User,
    Swipe,
    Match,
    Message,
    UserPhoto,
    UnoProfile,
    DuoProfile,
    DuoMember,
    DuoMemberPhoto,
    GroupProfile,
    GroupMember,
    GroupMemberPhoto
)

print("Dropping existing tables...")
Base.metadata.drop_all(bind=engine)

print("Creating new tables...")
Base.metadata.create_all(bind=engine)

print("Done.")