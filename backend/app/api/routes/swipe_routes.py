# swipe_routes.py  (all imports unchanged)
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.model import (
    Swipe, Match, User,
    UnoProfile, DuoProfile, DuoMember,
    GroupProfile, GroupMember, DuoMemberPhoto, 
    GroupMemberPhoto
)
from app.db.database import SessionLocal
from app.core.auth import decode_access_token
import logging
from sqlalchemy.orm import joinedload

logger = logging.getLogger("uvicorn.info")
router = APIRouter()

# ───────────────────────── helpers ──────────────────────────
def first_photo(user) -> str | None:
    if hasattr(user, "user_photos") and user.user_photos:
        return user.user_photos[0].photo_url
    return None

# ───────────────────────── deps  ────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
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

# ───────────────────────── swipe  ───────────────────────────
@router.post("/swipe")
def swipe(
    swipee_id: int,
    direction: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(
        f"[SWIPE RECEIVED] swiper={current_user.id} "
        f"swipee={swipee_id} direction={direction}"
    )

    if direction not in ("left", "right"):
        raise HTTPException(status_code=400, detail="Invalid direction")
    if swipee_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot swipe on yourself")

    existing = (
        db.query(Swipe)
        .filter_by(swiper_id=current_user.id, swipee_id=swipee_id)
        .first()
    )
    if existing:
        if existing.direction != direction:
            existing.direction = direction
            logger.info(
                f"[UPDATE] Changed swipe from {existing.direction} to {direction}"
            )
        else:
            logger.info("[SKIP] Swipe already exists with same direction")
            return {"message": "Swipe already recorded"}

    db.add(Swipe(swiper_id=current_user.id, swipee_id=swipee_id, direction=direction))

    try:
        if direction == "right":
            reverse = (
                db.query(Swipe)
                .filter_by(
                    swiper_id=swipee_id,
                    swipee_id=current_user.id,
                    direction="right",
                )
                .first()
            )
            if reverse:
                logger.info(f"[MATCH FOUND] {current_user.id} <-> {swipee_id}")
                user1_id, user2_id = sorted((current_user.id, swipee_id))
                if not db.query(Match).filter_by(
                    user1_id=user1_id, user2_id=user2_id
                ).first():
                    db.add(Match(user1_id=user1_id, user2_id=user2_id))

        db.commit()
    except Exception as e:
        logger.error(f"[DB COMMIT ERROR] {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save swipe")

    return {"message": "Swipe recorded"}

@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0),
    limit: int = Query(30),
):
    swiped_subq = (
        db.query(Swipe.swipee_id)
        .filter(Swipe.swiper_id == current_user.id)
        .subquery()
    )

    match_rows = db.query(Match).filter(
        or_(Match.user1_id == current_user.id,
            Match.user2_id == current_user.id)
    ).all()
    matched_ids = {
        m.user1_id if m.user2_id == current_user.id else m.user2_id
        for m in match_rows
    }

    incoming_right_swipes = {
        uid
        for uid, in db.query(Swipe.swiper_id)
        .filter_by(swipee_id=current_user.id, direction="right")
        .all()
    }

    exclude_ids = matched_ids | incoming_right_swipes

    recs = (
        db.query(User)
        .options(
            joinedload(User.user_photos),
            joinedload(User.uno_profile),
        )
        .filter(
            User.id != current_user.id,
            ~User.id.in_(swiped_subq),
            ~User.id.in_(exclude_ids),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for u in recs:
        photos = [p.photo_url for p in u.user_photos] if u.user_photos else []
        base = {
            "id":            u.id,
            "name":          u.name or "No Name",
            "profile_type":  u.profile_type or "No Profile Type",
            "profile_picture": first_photo(u),
            "photos":        photos,
            "location":      None,
            "gender":        None,
            "bio":           None,
            "age":           None,
            "ethnicity":     None,
            "looking_for":   None,
            "interests":     [],
            "members":       [],
        }

        if u.profile_type == "duo":
            duo = db.query(DuoProfile).filter_by(duo_id=u.id).first()
            if duo:
                base.update(
                    {
                        "location":    duo.location or "No Location",
                        "looking_for": duo.looking_for or "Not Specified",
                        "interests":   duo.interests or [],
                        "profile_picture": duo.profile_picture or "",
                    }
                )
                members = db.query(DuoMember).filter_by(duo_id=duo.id).all()
                duo_member_photos = {
                    p.duo_member_id: [] for p in db.query(DuoMemberPhoto).filter(
                        DuoMemberPhoto.duo_member_id.in_([m.id for m in members])
                    )
                }
                for p in db.query(DuoMemberPhoto).filter(
                    DuoMemberPhoto.duo_member_id.in_(duo_member_photos.keys())
                ):
                    duo_member_photos[p.duo_member_id].append(p.photo_url)

                base["members"] = [
                    {
                        "id": m.id,
                        "name": m.name or "No Name",
                        "age": m.age or "No Age",
                        "photos": duo_member_photos.get(m.id, []),
                    }
                    for m in members
                ]

        elif u.profile_type == "group":
            grp = db.query(GroupProfile).filter_by(group_id=u.id).first()
            if grp:
                base.update(
                    {
                        "location":    grp.location or "No Location",
                        "looking_for": grp.looking_for or "Not Specified",
                        "interests":   grp.interests or [],
                    }
                )
                members = db.query(GroupMember).filter_by(group_id=u.id).all()
                member_ids = [m.id for m in members]
                photo_map = {m.id: [] for m in members}
                for p in db.query(GroupMemberPhoto).filter(GroupMemberPhoto.group_member_id.in_(member_ids)):
                    photo_map[p.group_member_id].append(p.photo_url)
                base["members"] = [
                    {
                        "id":    m.id,
                        "name":  m.name or "No Name",
                        "age":   m.age or "No Age",
                        "photos": photo_map.get(m.id, []),
                    }
                    for m in members
                ]

        elif u.profile_type == "uno":
            uno = u.uno_profile
            if uno:
                base.update(
                    {
                        "bio":       uno.bio or "No Bio",
                        "age":       uno.age or "No Age",
                        "gender":    uno.gender or "No Gender",
                        "location":  uno.location or "No Location",
                        "ethnicity": uno.ethnicity or [],
                        "interests": uno.interests or [],
                    }
                )

        results.append(base)

    return results


# ───────────────────────── matches ──────────────────────────
@router.get("/matches")
def get_matches(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    print("GET /matches hit by user:", current_user.id)
    match_rows = db.query(Match).filter(
        or_(Match.user1_id == current_user.id, Match.user2_id == current_user.id)
    ).all()

    matched_user_ids = [
        m.user2_id if m.user1_id == current_user.id else m.user1_id for m in match_rows
    ]
    users = db.query(User).filter(User.id.in_(matched_user_ids)).all()

    results = []
    for u in users:
        base_info = {
            "id":            u.id,
            "name":          u.name,
            "profile_type":  u.profile_type,
            "profile_picture": first_photo(u),
        }

        if u.profile_type == "uno":
            uno = db.query(UnoProfile).filter_by(user_id=u.id).first()
            if uno:
                base_info.update(
                    {
                        "age":      uno.age,
                        "bio":      uno.bio,
                        "gender":   uno.gender,
                        "location": uno.location,
                    }
                )

        elif u.profile_type == "duo":
            duo_profile = db.query(DuoProfile).filter_by(duo_id=u.id).first()
            members = (
                db.query(DuoMember).filter_by(duo_id=duo_profile.id).all()
                if duo_profile
                else []
            )
            base_info.update(
                {
                    "location":  getattr(duo_profile, "location", None),
                    "interests": getattr(duo_profile, "interests", None),
                    "members": [
                        {
                            "id":     m.id,
                            "name":   m.name,
                            "age":    m.age,
                            "gender": getattr(m, "gender", None),
                        }
                        for m in members
                    ],
                }
            )

        elif u.profile_type == "group":
            group_profile = db.query(GroupProfile).filter_by(group_id=u.id).first()
            members = db.query(GroupMember).filter_by(group_id=u.id).all()
            base_info.update(
                {
                    "location":  getattr(group_profile, "location", None),
                    "interests": getattr(group_profile, "interests", None),
                    "members": [
                        {
                            "id":            m.id,
                            "name":          m.name,
                            "age":           m.age,
                            "profile_picture": getattr(m, "profile_picture", None),
                        }
                        for m in members
                    ],
                }
            )

        results.append(base_info)

    return results


@router.delete("/matches/{user_id}")
def delete_match(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Swipe).filter(
        or_(
            and_(Swipe.swiper_id == current_user.id, Swipe.swipee_id == user_id),
            and_(Swipe.swiper_id == user_id, Swipe.swipee_id == current_user.id),
        )
    ).delete(synchronize_session=False)

    db.query(Match).filter(
        or_(
            and_(Match.user1_id == current_user.id, Match.user2_id == user_id),
            and_(Match.user1_id == user_id, Match.user2_id == current_user.id),
        )
    ).delete(synchronize_session=False)

    db.commit()
    return {"message": f"Match and swipes with user {user_id} deleted."}


# ─────────────────── incoming requests ──────────────────────
@router.get("/incoming-requests")
def get_incoming_requests(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    right_ids = {
        uid
        for uid, in db.query(Swipe.swiper_id)
        .filter_by(swipee_id=current_user.id, direction="right")
        .all()
    }
    if not right_ids:
        return []

    match_rows = db.query(Match).filter(
        or_(Match.user1_id == current_user.id, Match.user2_id == current_user.id)
    ).all()
    matched_ids = {m.user1_id for m in match_rows} | {m.user2_id for m in match_rows}
    pending_ids = list(right_ids - matched_ids)
    if not pending_ids:
        return []

    users = db.query(User).filter(User.id.in_(pending_ids)).all()

    return [
        {
            "id":            u.id,
            "name":          u.name,
            "profile_type":  u.profile_type,
            "profile_picture": first_photo(u),
        }
        for u in users
    ]