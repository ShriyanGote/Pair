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
def upsert_group_profile(
    profile_data: GroupProfileInput,
    db: Session         = Depends(get_db),
    current_user: User  = Depends(get_current_user),
):
    if not 3 <= len(profile_data.members) <= 6:
        raise HTTPException(400, "Group must have 3-6 members")

    # ─── 1. get-or-create the GroupProfile row ───────────────────────────
    gp = (
        db.query(GroupProfile)
          .filter_by(group_id=current_user.id)
          .first()
    )
    if gp is None:
        gp = GroupProfile(group_id=current_user.id)
        db.add(gp)

    gp.location        = profile_data.location
    gp.interests       = profile_data.interests
    gp.looking_for     = profile_data.looking_for
    gp.past_activities = profile_data.past_activities
    gp.shared_bio      = profile_data.location
    gp.profile_picture = profile_data.profile_picture
    current_user.profile_type = "group"

    db.flush()                       # gp.id now guaranteed
    db.refresh(gp)

    # ─── 2. upsert members instead of deleting them ──────────────────────
    # build a dict keyed however you like – here we use the *name* (lower-cased)
    existing = {
        m.name.strip().lower(): m
        for m in db.query(GroupMember)
                   .filter_by(group_profile_id=gp.id)
                   .all()
    }
    seen_keys = set()

    for incoming in profile_data.members:
        key = incoming.name.strip().lower()
        seen_keys.add(key)

        if key in existing:
            member = existing[key]          # update in-place → photos survive
        else:
            member = GroupMember(
                group_id         = current_user.id,
                group_profile_id = gp.id,
            )
            db.add(member)

        # update / set fields
        member.name        = incoming.name
        member.age         = incoming.age
        member.gender      = incoming.gender
        member.ethnicity   = incoming.ethnicity
        member.personality = incoming.personality
        member.occupation  = incoming.occupation

    # delete members that the payload no longer contains  (optional)
    for key, member in existing.items():
        if key not in seen_keys:
            db.delete(member)              # their photos WILL cascade



    db.commit()
    return {"message": "Group profile created/updated successfully"}




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
    group_profile.shared_bio = data.get("shared_bio", group_profile.shared_bio)
    group_profile.profile_picture = data.get("profile_picture", group_profile.profile_picture)

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
            "profile_picture":group_profile.profile_picture,
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
    group_profile.profile_picture = data.get("profile_picture", group_profile.profile_picture)

    db.commit()
    db.refresh(group_profile)

    return {
        "message": "Group profile updated",
        "profile": {
            "profile_picture":group_profile.profile_picture,
            "location": group_profile.location,
            "interests": group_profile.interests,
            "looking_for": group_profile.looking_for,
            "past_activities": group_profile.past_activities,
        },
    }

