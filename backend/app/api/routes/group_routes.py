from fastapi import APIRouter, Depends, HTTPException, Body, Header
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import User, GroupMember, GroupMemberPhoto, GroupMemberInput, DuoProfileInput, GroupProfileInput
from app.models.model import GroupProfile
from app.core.auth import decode_access_token
from typing import Optional
from fastapi.encoders import jsonable_encoder


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
    gender: Optional[str] = Body(None),
    ethnicity: Optional[str] = Body(None),
    personality: Optional[list[str]] = Body(None),
    occupation: Optional[list[str]] = Body(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.profile_type == "uno":
        raise HTTPException(status_code=400, detail="User type is 'uno', cannot add group members")
    new_member = GroupMember(
        group_id=current_user.id,
        name=name,
        age=age,
        profile_photo=profile_photo,
        gender=gender,
        ethnicity=ethnicity,
        personality=personality,
        occupation=occupation
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Group member added", "member": new_member}

@router.get("/group-members")
def get_group_members(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.profile_type != "group":
        raise HTTPException(status_code=400, detail="Only group users have members.")
    return current_user.group_members

@router.delete("/group-members/{member_id}")
def delete_group_member(member_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = db.query(GroupMember).filter_by(id=member_id, group_id=current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")
    db.delete(member)
    db.commit()
    return {"message": "Member deleted"}

@router.post("/group-profile", response_model=None)
def create_group_profile(
    profile_data: GroupProfileInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (3 <= len(profile_data.members) <= 6):
        raise HTTPException(status_code=400, detail="Group must have 3 to 6 members.")

    if current_user.profile_type == "duo":
        raise HTTPException(status_code=400, detail="Please switch to group profile first.")

    # clear out any existing
    current_user.profile_type = "group"
    existing = db.query(GroupProfile).filter_by(group_id=current_user.id).first()
    if existing:
        db.query(GroupMember).filter_by(group_profile_id=existing.id).delete()
        db.delete(existing)
        db.commit()

    # now build a new one
    gp = GroupProfile(
        group_id=current_user.id,
        shared_bio=profile_data.location,
        location=profile_data.location,
        looking_for=profile_data.looking_for,
        interests=profile_data.interests,
        past_activities=profile_data.past_activities,
    )
    db.add(gp)
    db.commit()
    db.refresh(gp)

    for m in profile_data.members:
        db.add(GroupMember(
            group_id=current_user.id,
            group_profile_id=gp.id,
            name=m.name,
            age=m.age,
            profile_photo=m.profile_photo,
            gender=m.gender,
            ethnicity=m.ethnicity,
            personality=m.personality,
            occupation=m.occupation,
        ))
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

    group_profile = db.query(GroupProfile).filter_by(group_id=current_user.id).first()
    if not group_profile:
        raise HTTPException(status_code=404, detail="Group profile not found")

    group_profile.location = data.get("location", group_profile.location)
    group_profile.interests = data.get("interests", group_profile.interests)
    group_profile.looking_for = data.get("looking_for", group_profile.looking_for)

    db.commit()
    db.refresh(group_profile)

    return {
        "message": "Group profile updated",
        "profile": {
            "id": group_profile.id,
            "location": group_profile.location,
            "interests": group_profile.interests,
            "looking_for": group_profile.looking_for,
            "past_activities": group_profile.past_activities,
            "shared_bio": group_profile.shared_bio,
        }
    }

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
    member.gender = data.gender
    member.ethnicity = data.ethnicity
    member.personality = data.personality
    member.occupation = data.occupation
    if data.profile_photo:
        member.profile_photo = data.profile_photo

    db.commit()
    db.refresh(member)
    return {"message": "Member updated", "member": member}

@router.put("/me")
def update_group_shared_profile(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile_type != "group":
        raise HTTPException(status_code=400, detail="Only group profiles can be edited here.")

    group_profile = db.query(GroupProfile).filter_by(group_id=current_user.id).first()
    if not group_profile:
        raise HTTPException(status_code=404, detail="Group profile not found")

    group_profile.location = data.get("location", group_profile.location)
    group_profile.interests = data.get("interests", group_profile.interests)
    group_profile.looking_for = data.get("looking_for", group_profile.looking_for)
    group_profile.past_activities = data.get("past_activities", group_profile.past_activities)

    db.commit()
    db.refresh(group_profile)

    return {
        "message": "Group profile updated",
        "profile": {
            "location": group_profile.location,
            "interests": group_profile.interests,
            "looking_for": group_profile.looking_for,
            "past_activities": group_profile.past_activities,
        },
    }
