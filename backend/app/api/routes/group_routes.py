#group_routes.py

from fastapi import APIRouter, Depends, HTTPException, Body, Header
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import User, GroupMember
from app.core.auth import decode_access_token
from typing import Optional
from app.models.model import DuoProfileInput


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
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/group-members")
def add_group_member(
    name: str = Body(...),
    age: int = Body(...),
    profile_photo: Optional[str] = Body(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.profile_type == "uno":
        raise HTTPException(status_code=400, detail="User type is 'uno', cannot add group members")
    new_member = GroupMember(group_id=current_user.id, name=name, age=age, profile_photo=profile_photo)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Group member added", "member": new_member}

@router.get("/group-members")
def get_group_members(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.profile_type == "uno":
        return []
    return current_user.members

@router.delete("/group-members/{member_id}")
def delete_group_member(member_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = db.query(GroupMember).filter_by(id=member_id, group_id=current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")
    db.delete(member)
    db.commit()
    return {"message": "Member deleted"}




@router.post("/group-profile")
def create_group_profile(
    profile_data: DuoProfileInput,  # same as used for duo
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(profile_data.members) < 3 or len(profile_data.members) > 6:
        raise HTTPException(status_code=400, detail="Group must have 3 to 6 members.")

    current_user.profile_type = "group"
    current_user.location = profile_data.location
    current_user.interests = profile_data.interests
    current_user.looking_for = profile_data.looking_for
    db.add(current_user)

    for member in profile_data.members:
        new_member = GroupMember(
            group_id=current_user.id,
            name=member.name,
            age=member.age,
            height=member.height,
            profile_photo=member.profile_photo
        )
        db.add(new_member)

    db.commit()
    return {"message": "Group profile created successfully"}

@router.put("/group-profile")
def update_group_profile(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile_type != "group":
        raise HTTPException(status_code=400, detail="Only group profiles can be edited here.")

    current_user.location = data.get("location", current_user.location)
    current_user.interests = data.get("interests", current_user.interests)
    current_user.looking_for = data.get("looking_for", current_user.looking_for)

    db.commit()
    db.refresh(current_user)

    return {"message": "Group profile updated", "user": {
        "location": current_user.location,
        "interests": current_user.interests,
        "looking_for": current_user.looking_for
    }}