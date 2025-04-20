from fastapi import APIRouter, Depends, HTTPException, Body, Header
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import UnoProfile, User
from app.core.auth import decode_access_token
from typing import Optional, List

router = APIRouter()

# Dependency to get DB

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth helper

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Create or update uno profile

@router.post("/uno-profile")
def create_or_update_uno_profile(
    age: Optional[int] = Body(None),
    gender: Optional[str] = Body(None),
    bio: Optional[str] = Body(None),
    location: Optional[str] = Body(None),          # <-- add this
    name: Optional[str] = Body(None),
    occupation: Optional[List[str]] = Body(None),
    ethnicity: Optional[List[str]] = Body(None),
    personality: Optional[List[str]] = Body(None),
    past_activities: Optional[List[str]] = Body(None),
    social_media_use: Optional[int] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile_type != "uno":
        raise HTTPException(status_code=400, detail="Only UNO profiles can be edited here.")

    profile = db.query(UnoProfile).filter_by(user_id=current_user.id).first()

    if profile:
        profile.age = age
        profile.gender = gender
        profile.bio = bio
        profile.location = location 
        profile.occupation = occupation
        profile.ethnicity = ethnicity
        profile.personality = personality
        profile.past_activities = past_activities
        profile.social_media_use = social_media_use
    else:
        profile = UnoProfile(
            user_id=current_user.id,
            age=age,
            gender=gender,
            bio=bio,
            occupation=occupation,
            ethnicity=ethnicity,
            personality=personality,
            past_activities=past_activities,
            social_media_use=social_media_use,
            location=location
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)

    return {
        "message": "UNO profile saved",
        "profile": {
            "id": profile.id,
            "age": profile.age,
            "gender": profile.gender,
            "bio": profile.bio,
            "location": profile.location,
            "occupation": profile.occupation or [],
            "ethnicity": profile.ethnicity or [],
            "personality": profile.personality or [],
            "past_activities": profile.past_activities or [],
            "social_media_use": profile.social_media_use
        }
    }

# Fetch uno profile for current user

@router.get("/uno-profile")
def get_uno_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.profile_type != "uno":
        raise HTTPException(status_code=400, detail="Only UNO profiles can be accessed here.")

    profile = db.query(UnoProfile).filter_by(user_id=current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="UNO profile not found")

    return {
        "id": profile.id,
        "age": profile.age,
        "gender": profile.gender,
        "bio": profile.bio,
        "occupation": profile.occupation or [],
        "ethnicity": profile.ethnicity or [],
        "personality": profile.personality or [],
        "past_activities": profile.past_activities or [],
        "social_media_use": profile.social_media_use
    }   
