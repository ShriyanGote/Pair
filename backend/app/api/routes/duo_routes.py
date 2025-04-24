from fastapi import APIRouter, Depends, HTTPException, Body, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app.db.database import SessionLocal
from app.models.model import User, DuoProfile, DuoProfileInput, DuoMember, GroupMemberInput, GroupProfile, DuoMemberPhoto
from app.db.crud import get_user_by_email
from app.core.auth import decode_access_token

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
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

@router.get("/me")
def read_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    out = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "profile_type": current_user.profile_type,
        "duo_profile": None,
        "group_profile": None,
        "members": [],
    }

    if current_user.profile_type == "duo":
        dp = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
        if dp:
            out["duo_profile"] = {
                "id": dp.id,
                "shared_bio": dp.shared_bio,
                "location": dp.location,
                "interests": dp.interests,
                "looking_for": dp.looking_for,
                "past_activities": dp.past_activities,
            }
            out["members"] = [
                {
                    "id": m.id,
                    "name": m.name,
                    "age": m.age,
                    "gender": m.gender,
                    "ethnicity": m.ethnicity,
                    "personality": m.personality,
                    "occupation":m.occupation,
                }
                for m in dp.members
            ]
    return out

@router.put("/me")
def update_duo_shared_profile(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile_type != "duo":
        raise HTTPException(status_code=400, detail="Only duo profiles can be edited here.")

    duo_profile = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
    if not duo_profile:
        raise HTTPException(status_code=404, detail="Duo profile not found")

    duo_profile.location = data.get("location", duo_profile.location)
    duo_profile.interests = data.get("interests", duo_profile.interests)
    duo_profile.looking_for = data.get("looking_for", duo_profile.looking_for)
    duo_profile.past_activities = data.get("past_activities", duo_profile.past_activities)

    db.commit()
    db.refresh(duo_profile)

    return {
        "message": "Duo profile updated",
        "profile": {
            "location": duo_profile.location,
            "interests": duo_profile.interests,
            "looking_for": duo_profile.looking_for,
            "past_activities": duo_profile.past_activities,
        },
    }

@router.post("/duo-profile")
def create_duo_profile(
    profile_data: DuoProfileInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile_type == "group":
        raise HTTPException(status_code=400, detail="Please switch to 'duo' to create a duo profile.")

    current_user.profile_type = "duo"
    db.commit()

    existing = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
    if existing:
        for member in profile_data.members:
            db.add(DuoMember(
                duo_id=existing.id,
                name=member.name,
                age=member.age,
                gender=member.gender,
                ethnicity=member.ethnicity,
                personality=member.personality,
                occupation=member.occupation,
            ))
        db.commit()
        return {"message": "Added new members to existing duo", "duo_id": existing.id}

    duo_profile = DuoProfile(
        duo_id=current_user.id,
        shared_bio=profile_data.location,
        location=profile_data.location,
        interests=profile_data.interests,
        looking_for=profile_data.looking_for,
        past_activities=profile_data.past_activities,
    )
    db.add(duo_profile)
    db.commit()
    db.refresh(duo_profile)

    for member in profile_data.members:
        db.add(DuoMember(
            duo_id=duo_profile.id,
            name=member.name,
            age=member.age,
            gender=member.gender,
            ethnicity=member.ethnicity,
            personality=member.personality,
            occupation=member.occupation,
        ))
    db.commit()

    return {"message": "Duo profile created successfully", "duo_id": duo_profile.id}

@router.post("/duo-members")
def add_duo_member(
    member: GroupMemberInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile_type != "duo":
        raise HTTPException(status_code=400, detail="Only duo profiles can get new members")

    duo = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
    if not duo:
        raise HTTPException(status_code=404, detail="Duo profile not found")

    new_member = DuoMember(
        duo_id=duo.id,
        name=member.name,
        age=member.age,
        gender=member.gender,
        ethnicity=member.ethnicity,
        personality=member.personality,
        occupation=member.occupation,
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Member added", "member": {"id": new_member.id, **member.dict()}}

@router.get("/duo-members")
def list_duo_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.profile_type != "duo":
        raise HTTPException(status_code=400, detail="Only duo profiles have members")
    duo = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
    if not duo:
        raise HTTPException(status_code=404, detail="Duo profile not found")
    return [
        {
            "id": m.id,
            "name": m.name,
            "age": m.age,
            "gender": m.gender,
            "ethnicity": m.ethnicity,
            "personality": m.personality,
            "occupation":m.occupation,
        }
        for m in duo.members
    ]

@router.put("/duo-members/{member_id}")
def update_duo_member(
    member_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    duo = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
    if not duo:
        raise HTTPException(status_code=404, detail="Duo profile not found")

    member = db.query(DuoMember).filter_by(id=member_id, duo_id=duo.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.name = data.get("name", member.name)
    member.age = data.get("age", member.age)
    member.gender = data.get("gender", member.gender)
    member.ethnicity = data.get("ethnicity", member.ethnicity)
    member.occupation = data.get("occupation", member.occupation)
    member.personality = data.get("personality", member.personality)

    db.commit()
    db.refresh(member)
    return {
        "message": "Member updated",
        "member": {
            "id": member.id,
            "name": member.name,
            "age": member.age,
            "gender": member.gender,
            "ethnicity": member.ethnicity,
            "personality": member.personality,
            "occupation":member.occupation,
        },
    }



@router.delete("/duo-members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_duo_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # make sure this member really belongs to the current user’s duo
    duo_profile = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
    if not duo_profile:
        raise HTTPException(404, "Duo profile not found")

    member = (
        db.query(DuoMember)
          .filter_by(id=member_id, duo_id=duo_profile.id)
          .first()
    )
    if not member:
        raise HTTPException(404, "Member not found")

    # delete any photos
    db.query(DuoMemberPhoto).filter_by(duo_member_id=member_id).delete(synchronize_session=False)
    # delete the member
    db.delete(member)
    db.commit()
    return