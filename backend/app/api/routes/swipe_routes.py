# swipe_routes.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.models.model import Swipe, Match, User
from app.db.database import SessionLocal
from app.core.auth import decode_access_token
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
    logger.info(f"[SWIPE RECEIVED] swiper={current_user.id} swipee={swipee_id} direction={direction}")

    if direction not in ["left", "right"]:
        raise HTTPException(status_code=400, detail="Invalid direction")

    if swipee_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot swipe on yourself")

    existing = db.query(Swipe).filter_by(swiper_id=current_user.id, swipee_id=swipee_id).first()
    if existing:
        if existing.direction != direction:
            existing.direction = direction
            logger.info(f"[UPDATE] Changed swipe from {existing.direction} to {direction}")
        else:
            logger.info("[SKIP] Swipe already exists with same direction")
            return {"message": "Swipe already recorded"}

    swipe = Swipe(swiper_id=current_user.id, swipee_id=swipee_id, direction=direction)
    db.add(swipe)

    try:
        if direction == "right":
            reverse = db.query(Swipe).filter_by(swiper_id=swipee_id, swipee_id=current_user.id, direction="right").first()
            if reverse:
                logger.info(f"[MATCH FOUND] {current_user.id} <-> {swipee_id}")
                user1_id = min(current_user.id, swipee_id)
                user2_id = max(current_user.id, swipee_id)

                existing_match = db.query(Match).filter_by(user1_id=user1_id, user2_id=user2_id).first()
                if not existing_match:
                    db.add(Match(user1_id=user1_id, user2_id=user2_id))

        db.commit()
        logger.info("[DB] Swipe committed")
    except Exception as e:
        logger.error(f"[DB COMMIT ERROR] {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save swipe")

    return {"message": "Swipe recorded"}

@router.get("/recommendations")
def get_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    right_swipes = db.query(Swipe.swipee_id).filter(
        Swipe.swiper_id == current_user.id,
        Swipe.direction == 'right'
    )

    recommendations = db.query(User).filter(
        User.id != current_user.id,
        ~User.id.in_(right_swipes)
    ).all()

    results = []
    for u in recommendations:
        base_info = {
            "id": u.id,
            "name": u.name,
            "age": u.age,
            "location": u.location,
            "bio": u.bio,
            "height": u.height,
            "gender": u.gender,
            "profile_photo": u.profile_photo,
            "profile_type": u.profile_type,
            "interests": u.interests,
            "looking_for": u.looking_for,
        }

        if u.profile_type in ("duo", "group"):
            base_info["members"] = [
                {
                    "id": m.id,
                    "name": m.name,
                    "age": m.age,
                    "height": m.height,
                    "profile_photo": m.profile_photo
                } for m in u.members
            ]
        else:
            base_info["members"] = None

        results.append(base_info)

    return results





@router.get("/matches")
def get_matches(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    match_rows = db.query(Match).filter(
        or_(
            Match.user1_id == current_user.id,
            Match.user2_id == current_user.id
        )
    ).all()

    matched_user_ids = [
        m.user2_id if m.user1_id == current_user.id else m.user1_id
        for m in match_rows
    ]

    users = db.query(User).filter(User.id.in_(matched_user_ids)).all()

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
            "profile_photo": u.profile_photo,
        }
        for u in users
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

