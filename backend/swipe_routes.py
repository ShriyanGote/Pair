# swipe_routes.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from model import Swipe, Match, User
from database import SessionLocal
from auth import decode_access_token
from sqlalchemy import and_, or_
from sqlalchemy import select

import logging
logger = logging.getLogger('uvicorn.info')

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
    logger.info(f"[SWIPE] User {current_user.id} swiped {direction} on {swipee_id}")
    
    if direction not in ["left", "right"]:
        logger.warning("[SWIPE] Invalid direction received:", direction)
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
            logger.info('this is a match')
            match = Match(user1_id=min(current_user.id, swipee_id), user2_id=max(current_user.id, swipee_id))
            db.add(match)
        else:
            logger.info('not a match')

    db.commit()
    logger.info('swipe recorded')
    return {"message": "Swipe recorded"}

@router.get("/recommendations")
def get_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Subquery: who the current user has right-swiped (matches)
    right_swipes = db.query(Swipe.swipee_id).filter(
        Swipe.swiper_id == current_user.id,
        Swipe.direction == 'right'
    )

    # Exclude: self and right-swiped users
    recommendations = db.query(User).filter(
        User.id != current_user.id,
        ~User.id.in_(right_swipes)
    ).all()

    return [
        {
            "id": u.id,
            "name": u.name,
            "age": u.age,
            "location": u.location,
            "bio": u.bio,
            "height": u.height,
            "gender": u.gender,
            "profile_photo": None,  # Add if you have
        }
        for u in recommendations
    ]





@router.get("/matches")
def get_matches(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    liked_me = db.query(Swipe.swiper_id).filter(
        Swipe.swipee_id == current_user.id,
        Swipe.direction == "right"
    ).subquery()

    i_liked = db.query(Swipe.swipee_id).filter(
        Swipe.swiper_id == current_user.id,
        Swipe.direction == "right"
    ).subquery()

    matches = db.query(User).filter(
        User.id.in_(liked_me),
        User.id.in_(i_liked)
    ).all()

    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "age": u.age,
            "location": u.location,
            "bio": u.bio,
            "height": u.height,
            "gender": u.gender,
            "profile_photo": None,
        }
        for u in matches
    ]


@router.delete("/matches/{user_id}")
def delete_match(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Delete both swipe directions (A→B and B→A)
    deleted = db.query(Swipe).filter(
        or_(
            and_(Swipe.swiper_id == current_user.id, Swipe.swipee_id == user_id),
            and_(Swipe.swiper_id == user_id, Swipe.swipee_id == current_user.id)
        )
    ).delete(synchronize_session=False)

    # Also remove the match entry if one exists
    db.query(Match).filter(
        or_(
            and_(Match.user1_id == current_user.id, Match.user2_id == user_id),
            and_(Match.user1_id == user_id, Match.user2_id == current_user.id)
        )
    ).delete(synchronize_session=False)

    db.commit()
    return {"message": f"Match and swipes with user {user_id} deleted."}

