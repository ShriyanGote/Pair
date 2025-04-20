# app/api/users.py

import random
from datetime import timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body, Header
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.crud import create_user, get_user_by_email, verify_password
from app.models.model import (
    User,
    UnoProfile,
    DuoProfile,
    GroupProfile,
    UserCreate,
    UserLogin,
    UserUpdate,
    EmailRequest,
    DuoMember, 
    GroupMember
)
from app.core.auth import create_access_token, decode_access_token
from app.core.email_util import send_verification_email

router = APIRouter()


def to_dict(obj):
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid auth header")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(401, "Invalid token")
    user = get_user_by_email(db, payload["sub"])
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.post("/register", summary="Create a new user (uno/duo/group)")
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    if get_user_by_email(db, user.email):
        raise HTTPException(400, "User already exists")

    new_user = create_user(
        db,
        name=user.name,
        email=user.email,
        password=user.password,
        profile_type=user.profile_type,
        age=user.age,
        gender=user.gender,
        location=user.location,
        ethnicity=user.ethnicity,
        social_media_use=user.social_media_use,
        personality=user.personality,
        occupation=user.occupation,
        interests=user.interests,
        past_activities=user.past_activities,
        looking_for=user.looking_for,
        bio=user.bio,
    )
    return {"message": f"User {new_user.name} registered!"}


@router.post("/login", summary="Authenticate and get a JWT")
def login(
    creds: UserLogin,
    db: Session = Depends(get_db),
):
    db_user = get_user_by_email(db, creds.email)
    if not db_user or not verify_password(creds.password, db_user.hashed_password):
        raise HTTPException(400, "Invalid email or password")

    token = create_access_token(
        data={"sub": db_user.email}, expires_delta=timedelta(days=7)
    )
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", summary="Get current user's profile")
def read_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resp = to_dict(current_user)

    # Attach UNO profile fields
    if current_user.profile_type == "uno":
        uno = db.query(UnoProfile).filter_by(user_id=current_user.id).first()
        if uno:
            resp.update(
                {
                    "age": uno.age,
                    "gender": uno.gender,
                    "bio": uno.bio,
                    "location": uno.location,            # ✅ add this
                    "name": current_user.name, 
                    "occupation": uno.occupation or [],
                    "ethnicity": uno.ethnicity or [],
                    "personality": uno.personality or [],
                    "past_activities": uno.past_activities or [],
                    "social_media_use": uno.social_media_use,
                    "interests": uno.interests or [],
                }
            )

    # Attach Duo profile fields
    if current_user.profile_type == "duo":
        duo = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
        if duo:
            resp.update(
                {
                    "shared_bio": duo.shared_bio,
                    "location": duo.location,
                    "looking_for": duo.looking_for,
                    "interests": duo.interests or [],
                    "past_activities": duo.past_activities or [],
                }
            )

    # Attach Group profile fields + members
    if current_user.profile_type == "group":
        grp = db.query(GroupProfile).filter_by(group_id=current_user.id).first()
        members = (
            db.query(GroupProfile)  # or GroupMember if you have that
            .filter_by(group_id=current_user.id)
            .all()
        )
        if grp:
            resp.update(
                {
                    "shared_bio": grp.shared_bio,
                    "location": grp.location,
                    "looking_for": grp.looking_for,
                    "interests": grp.interests or [],
                    "past_activities": grp.past_activities or [],
                }
            )
        resp["members"] = [to_dict(m) for m in members]

    return resp


@router.put("/users/{user_id}", summary="Update a user's profile")
def update_user_profile(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    # Always allow these
    for attr in ("name", "email", "profile_photo", "location"):
        val = getattr(data, attr)
        if val is not None:
            setattr(user, attr, val)

    # Now profile‐type specific
    if user.profile_type == "uno":
        uno = db.query(UnoProfile).filter_by(user_id=user.id).first()
        if not uno:
            uno = UnoProfile(user_id=user.id)
            db.add(uno)
        for arr_field in (
            "occupation",
            "ethnicity",
            "personality",
            "past_activities",
            "interests",
        ):
            val = getattr(data, arr_field)
            if val is not None:
                setattr(uno, arr_field, val)
        # scalar fields
        for scalar in ("age", "gender", "bio", "social_media_use"):
            val = getattr(data, scalar)
            if val is not None:
                setattr(uno, scalar, val)

    elif user.profile_type == "duo":
        duo = db.query(DuoProfile).filter_by(duo_id=user.id).first()
        if duo:
            for arr_field in ("interests", "past_activities"):
                val = getattr(data, arr_field)
                if val is not None:
                    setattr(duo, arr_field, val)
            for scalar in ("shared_bio", "location", "looking_for"):
                val = getattr(data, scalar)
                if val is not None:
                    setattr(duo, scalar, val)

    elif user.profile_type == "group":
        grp = db.query(GroupProfile).filter_by(group_id=user.id).first()
        if grp:
            for arr_field in ("interests", "past_activities"):
                val = getattr(data, arr_field)
                if val is not None:
                    setattr(grp, arr_field, val)
            for scalar in ("shared_bio", "location", "looking_for"):
                val = getattr(data, scalar)
                if val is not None:
                    setattr(grp, scalar, val)

    db.commit()
    db.refresh(user)
    return {"message": "Profile updated", "user": to_dict(user)}


@router.post("/send-code", summary="Send email verification code")
def send_code(
    payload: EmailRequest, db: Session = Depends(get_db)
):
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(404, "No account found")
    code = str(random.randint(100_000, 999_999))
    user.verification_code = code
    db.commit()
    send_verification_email(payload.email, code)
    return {"message": "Verification code sent"}


@router.post("/verify-code", summary="Verify email code")
def verify_code(
    email: str = Body(...),
    code: str = Body(...),
    db: Session = Depends(get_db),
):
    user = get_user_by_email(db, email)
    if user:
        user.is_verified = True
        db.commit()
        token = create_access_token(data={"sub": user.email})
        return {"message": "Email verified", "access_token": token}
    raise HTTPException(400, "Invalid code")

@router.put("/profile-type", summary="Switch uno/duo/group")
def switch_profile_type(
    new_type: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    valid = {"uno", "duo", "group"}
    if new_type not in valid:
        raise HTTPException(400, "Invalid profile type")

    if current_user.profile_type == new_type:
        return {"message": f"Already '{new_type}'"}

    # --- 1) If they were in a duo, tear down that profile & its members ---
    if current_user.profile_type == "duo":
        # fetch the DuoProfile row
        existing = (
            db.query(DuoProfile)
              .filter_by(duo_id=current_user.id)
              .one_or_none()
        )
        if existing:
            # delete all members whose duo_id FK == existing.id
            db.query(DuoMember).filter_by(duo_id=existing.id).delete()
            # delete the profile itself
            db.delete(existing)

    # --- 2) If they were in a group, same idea for GroupProfile & GroupMember... ---
    if current_user.profile_type == "group":
        existing = (
            db.query(GroupProfile)
              .filter_by(group_id=current_user.id)
              .one_or_none()
        )
        if existing:
            db.query(GroupMember).filter_by(group_id=existing.id).delete()
            db.delete(existing)

    # --- 3) If they were in “uno”, just delete the uno profile row ---
    if current_user.profile_type == "uno":
        db.query(UnoProfile).filter_by(user_id=current_user.id).delete()

    # --- 4) now add the fresh profile record for the new type ---
    if new_type == "uno":
        db.add(UnoProfile(user_id=current_user.id))
    elif new_type == "duo":
        db.add(DuoProfile(duo_id=current_user.id))
    else:  # group
        db.add(GroupProfile(group_id=current_user.id))

    # update the user and commit everything at once
    current_user.profile_type = new_type
    db.commit()

    return {"message": f"Switched to '{new_type}' and cleared old data"}