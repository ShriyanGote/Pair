from fastapi import APIRouter, Depends, HTTPException, Body, Header
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import User, DuoProfileInput, GroupMemberInput, GroupMember
from app.db.crud import get_user_by_email
from app.core.auth import decode_access_token

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

@router.post("/duo-profile")
def create_duo_profile(
    profile_data: DuoProfileInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.profile_type = "duo"
    current_user.location = profile_data.location
    current_user.interests = profile_data.interests
    current_user.looking_for = profile_data.looking_for
    db.add(current_user)
    for member in profile_data.members:
        new_member = GroupMember(
            group_id=current_user.id,
            name=member.name,
            age=member.age,
            height=member.height
        )
        db.add(new_member)
    db.commit()
    return {"message": "Duo profile created successfully"}

@router.put("/me")
def update_duo_shared_profile(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile_type != "duo":
        raise HTTPException(status_code=400, detail="Only duo profiles can be edited here.")
    current_user.location = data.get("location", current_user.location)
    current_user.interests = data.get("interests", current_user.interests)
    current_user.looking_for = data.get("looking_for", current_user.looking_for)
    db.commit()
    db.refresh(current_user)
    return {"message": "Duo profile updated", "user": {
        "location": current_user.location,
        "interests": current_user.interests,
        "looking_for": current_user.looking_for
    }}

@router.put("/group-members/{member_id}")
def update_group_member(
    member_id: int,
    data: GroupMemberInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(GroupMember).filter_by(id=member_id, group_id=current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")
    member.name = data.name
    member.age = data.age
    member.height = data.height
    if data.profile_photo:
        member.profile_photo = data.profile_photo
    db.commit()
    db.refresh(member)
    return {"message": "Member updated", "member": member}