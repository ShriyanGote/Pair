#crud.py

from sqlalchemy.orm import Session
from app.models.model import User
from passlib.context import CryptContext
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_user(
    db: Session,
    name: str,
    email: str,
    password: str,
    profile_type: str = "uno",
    age: Optional[int] = None,
    gender: Optional[str] = None,
    location: Optional[str] = None,
    ethnicity: Optional[str] = None,
    social_media_use: Optional[int] = None,
    personality: Optional[str] = None,
    occupation: Optional[str] = None,
    interests: Optional[str] = None,
    past_activities: Optional[str] = None,
    looking_for: Optional[str] = None,
):
    hashed_password = get_password_hash(password)
    db_user = User(
        name=name,
        email=email,
        hashed_password=hashed_password,
        profile_type=profile_type,
        age=age,
        gender=gender,
        location=location,
        ethnicity=ethnicity,
        social_media_use=social_media_use,
        personality=personality,
        occupation=occupation,
        interests=interests,
        past_activities=past_activities,
        looking_for=looking_for,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
