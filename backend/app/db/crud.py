# app/db/crud.py

from typing import Optional, List
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.model import (
    User,
    UnoProfile,
    DuoProfile,
    GroupProfile,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_user(
    db: Session,
    *,
    name: str,
    email: str,
    password: str,
    profile_type: str = "uno",
    age: Optional[int] = None,
    gender: Optional[str] = None,
    location: Optional[str] = None,
    ethnicity: Optional[List[str]] = None,
    social_media_use: Optional[int] = None,
    personality: Optional[List[str]] = None,
    occupation: Optional[List[str]] = None,
    interests: Optional[List[str]] = None,
    past_activities: Optional[List[str]] = None,
    looking_for: Optional[str] = None,
    bio: Optional[str] = None,
) -> User:
    """
    1) Insert into `users`
    2) Insert into either `uno_profiles`, `duo_profiles` or `group_profiles`
       with the correct columns.
    """

    # --- 1) Base User ---
    hashed = get_password_hash(password)
    db_user = User(
        name=name,
        email=email,
        hashed_password=hashed,
        profile_type=profile_type,
        is_verified=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # --- 2) Profile details ---
    if profile_type == "uno":
        # pass interests here too!
        uno = UnoProfile(
            user_id=db_user.id,
            age=age,
            gender=gender,
            bio=bio,
            occupation=occupation or [],
            ethnicity=ethnicity or [],
            personality=personality or [],
            interests=interests or [],           # ← newly added
            past_activities=past_activities or [],
            social_media_use=social_media_use,
        )
        db.add(uno)

    else:
        # Duo or Group share same shape
        if profile_type == "duo":
            Model = DuoProfile
            fk = "duo_id"
        else:
            Model = GroupProfile
            fk = "group_id"

        data = {
            fk: db_user.id,
            "shared_bio": bio,
            "location": location,
            "looking_for": looking_for,
            "interests": interests or [],
            "past_activities": past_activities or [],
        }
        # drop any None
        cleaned = {k: v for k, v in data.items() if v is not None}
        profile = Model(**cleaned)
        db.add(profile)

    db.commit()
    return db_user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()