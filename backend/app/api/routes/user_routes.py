from fastapi import APIRouter, Depends, HTTPException, Body, Header
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import User, UserCreate, UserLogin, UserUpdate, EmailRequest, GroupMember
from app.db.crud import create_user, get_user_by_email, verify_password
from app.core.auth import create_access_token, decode_access_token
from app.core.email_util import send_verification_email
from datetime import timedelta
import random


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_email(db, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, user.email)
    if existing:
        return {"error": "User already exists"}
    new_user = create_user(db, name=user.name, email=user.email, password=user.password, profile_type=user.profile_type)
    return {"message": f"User {new_user.name} registered!"}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        return {"error": "Invalid email or password"}
    token = create_access_token(data={"sub": db_user.email}, expires_delta=timedelta(minutes=30))
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {
        **current_user.__dict__,
        "members": current_user.members,
    }

@router.put("/users/{user_id}")
def update_user_profile(user_id: int, updated_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = updated_data.name
    user.email = updated_data.email
    if updated_data.password:
        user.hashed_password = updated_data.password
    user.bio = updated_data.bio
    user.age = updated_data.age
    user.gender = updated_data.gender
    user.location = updated_data.location
    user.height = updated_data.height
    user.profile_type = updated_data.profile_type
    db.commit()
    db.refresh(user)
    return {"message": "User profile updated", "user": user}

@router.post("/send-code")
def send_code(payload: EmailRequest, db: Session = Depends(get_db)):
    email = payload.email
    code = str(random.randint(100000, 999999))
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="No account found.")
    user.verification_code = code
    db.commit()
    send_verification_email(email, code)
    return {"message": "Verification code sent"}

@router.post("/verify-code")
def verify_code(email: str = Body(...), code: str = Body(...), db: Session = Depends(get_db)):
    user = get_user_by_email(db, email)
    user.is_verified = True  # (temp override for dev)
    db.commit()
    token = create_access_token(data={"sub": user.email})
    return {"message": "Email verified", "access_token": token}

@router.put("/profile-type")
def update_profile_type(
    new_type: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_types = {"uno", "duo", "group"}
    if new_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid profile type.")

    if current_user.profile_type == new_type:
        return {"message": "Already this profile type."}

    # Cleanup if downgrading to "uno"
    if new_type == "uno":
        db.query(GroupMember).filter_by(group_id=current_user.id).delete()

    # Update profile type
    current_user.profile_type = new_type
    db.commit()

    return {"message": f"Profile type updated to '{new_type}'."}