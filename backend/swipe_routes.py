
# swipe_routes.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from model import Swipe, Match, User
from database import SessionLocal
from auth import decode_access_token
from sqlalchemy import and_, or_

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

@router.post("/swipe")
def swipe(swipee_id: int, direction: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if direction not in ["left", "right"]:
        raise HTTPException(status_code=400, detail="Invalid direction")

    # Prevent duplicate swipes
    existing = db.query(Swipe).filter_by(swiper_id=current_user.id, swipee_id=swipee_id).first()
    if existing:
        return {"message": "Swipe already recorded"}

    # Record swipe
    swipe = Swipe(swiper_id=current_user.id, swipee_id=swipee_id, direction=direction)
    db.add(swipe)

    if direction == "right":
        # Check for a match
        mutual = db.query(Swipe).filter_by(swiper_id=swipee_id, swipee_id=current_user.id, direction="right").first()
        if mutual:
            match = Match(user1_id=min(current_user.id, swipee_id), user2_id=max(current_user.id, swipee_id))
            db.add(match)

    db.commit()
    return {"message": "Swipe recorded"}

@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get IDs of users the current user has swiped on
    swiped_ids = db.query(Swipe.swipee_id).filter(Swipe.swiper_id == current_user.id)
    # Recommend users that are not the current user and haven't been swiped on
    users = db.query(User).filter(
        User.id != current_user.id,
        ~User.id.in_(swiped_ids)
    ).limit(10).all()
    return users

