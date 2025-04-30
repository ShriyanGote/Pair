from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import (
    User,
    UserPhoto,
    UnoProfile,              #  ← NEW
    GroupProfile,            #  ← NEW+    
    DuoProfile,
    GroupMemberPhoto, GroupMember,
    DuoMemberPhoto, DuoMember
)
from app.core.auth import decode_access_token
import boto3, os, uuid

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

@router.get("/users/{user_id}/photos")
def get_user_photos(user_id: int, db: Session = Depends(get_db)):
    photos = db.query(UserPhoto).filter(UserPhoto.user_id == user_id).all()
    return [{"id": p.id, "photo_url": p.photo_url} for p in photos]

@router.post("/upload-uno-photo")
async def upload_uno_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)):
    if current_user.profile_type != 'uno':
        raise HTTPException(status_code=403, detail="This endpoint is for UNO profiles only")

    existing_photos = db.query(UserPhoto).filter(UserPhoto.user_id == current_user.id).count()
    if existing_photos >= 5:
        raise HTTPException(status_code=400, detail="You already have 5 photos. Delete one first.")

    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_S3_REGION")
    )
    extension = file.filename.split(".")[-1]
    unique_filename = f"profile_photos/{uuid.uuid4()}.{extension}"

    try:
        s3.upload_fileobj(
            file.file,
            os.getenv("AWS_S3_BUCKET_NAME"),
            unique_filename,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")

    photo_url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{unique_filename}"
    new_photo = UserPhoto(user_id=current_user.id, photo_url=photo_url)
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    if current_user.profile_type == "uno":
        uno = db.query(UnoProfile).filter_by(user_id=current_user.id).first()
        if uno and not uno.profile_picture:
            uno.profile_picture = photo_url
            db.commit()

    return {"photo_id": new_photo.id, "photo_url": photo_url}

@router.delete("/users/{user_id}/photos/{photo_id}")
def delete_user_photo(user_id: int, photo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not your account")

    photo_record = db.query(UserPhoto).filter(UserPhoto.id == photo_id, UserPhoto.user_id == user_id).first()
    if not photo_record:
        raise HTTPException(status_code=404, detail="Photo not found")

    db.delete(photo_record)
    db.commit()
    return {"message": "Photo deleted"}

@router.get("/group-members/{member_id}/photos")
def get_group_member_photos(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    member = db.query(GroupMember).filter_by(id=member_id, group_id=current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")

    return [{"id": p.id, "photo_url": p.photo_url} for p in member.photos]

@router.post("/group-members/{member_id}/photos")
def upload_group_member_photo(member_id: int, file: UploadFile = File(...), is_primary: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    member = db.query(GroupMember).filter_by(id=member_id, group_id=current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")

    existing_count = db.query(GroupMemberPhoto).filter_by(group_member_id=member_id).count()
    if existing_count >= 3:
        raise HTTPException(status_code=400, detail="Already have 3 photos for this member")

    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_S3_REGION"),
    )
    extension = file.filename.split(".")[-1]
    unique_filename = f"profile_photos/{uuid.uuid4()}.{extension}"

    try:
        s3.upload_fileobj(
            file.file,
            os.getenv("AWS_S3_BUCKET_NAME"),
            unique_filename,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")

    photo_url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{unique_filename}"
    new_photo = GroupMemberPhoto(group_member_id=member.id, photo_url=photo_url)
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    if is_primary:
        gp = db.query(GroupProfile).filter_by(group_id=current_user.id).first()
        if gp:
            gp.profile_picture = photo_url
            db.commit()

    return {"photo_id": new_photo.id, "photo_url": photo_url}

@router.delete("/group-members/{member_id}/photos/{photo_id}")
def delete_group_member_photo(member_id: int, photo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    member = db.query(GroupMember).filter_by(id=member_id, group_id=current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")

    photo = db.query(GroupMemberPhoto).filter_by(id=photo_id, group_member_id=member_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    db.delete(photo)
    db.commit()
    return {"message": "Photo deleted"}

@router.get("/duo-members/{member_id}/photos")
def get_duo_member_photos(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    member = db.query(DuoMember).join(DuoProfile).filter(
        DuoMember.id == member_id,
        DuoProfile.duo_id == current_user.id,
        DuoMember.duo_id == DuoProfile.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Duo member not found")
    return [{"id": p.id, "photo_url": p.photo_url} for p in member.photos]

@router.post("/duo-members/{member_id}/photos")
def upload_duo_member_photo(member_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    member = db.query(DuoMember).join(DuoProfile).filter(
        DuoMember.id == member_id,
        DuoProfile.duo_id == current_user.id,
        DuoMember.duo_id == DuoProfile.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Duo member not found")

    existing_count = db.query(DuoMemberPhoto).filter_by(duo_member_id=member_id).count()
    if existing_count >= 3:
        raise HTTPException(status_code=400, detail="Already have 3 photos for this member")

    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_S3_REGION")
    )
    extension = file.filename.split(".")[-1]
    unique_filename = f"profile_photos/{uuid.uuid4()}.{extension}"

    try:
        s3.upload_fileobj(
            file.file,
            os.getenv("AWS_S3_BUCKET_NAME"),
            unique_filename,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")

    photo_url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{unique_filename}"
    new_photo = DuoMemberPhoto(duo_member_id=member.id, photo_url=photo_url)
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)

    return {"photo_id": new_photo.id, "photo_url": photo_url}

@router.post("/duo-profile/photo")
def upload_duo_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session      = Depends(get_db)
):
    if current_user.profile_type != "duo":
        raise HTTPException(403, "Only DUO accounts can use this route")

    # --- 1. push to S3 exactly like the others --------------------------
    s3 = boto3.client(
        "s3",
        aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name = os.getenv("AWS_S3_REGION"),
    )
    ext = file.filename.rsplit(".", 1)[-1]
    key = f"profile_photos/{uuid.uuid4()}.{ext}"
    s3.upload_fileobj(
        file.file, os.getenv("AWS_S3_BUCKET_NAME"), key,
        ExtraArgs={"ContentType": file.content_type},
    )
    url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{key}"

    # --- 2. save on DuoProfile row --------------------------------------
    dp = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
    if not dp:
        dp = DuoProfile(duo_id=current_user.id)
        db.add(dp)
    dp.profile_picture = url
    db.commit()
    return {"profile_picture": url}



@router.delete("/duo-members/{member_id}/photos/{photo_id}")
def delete_duo_member_photo(member_id: int, photo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    member = db.query(DuoMember).join(DuoProfile).filter(
        DuoMember.id == member_id,
        DuoProfile.duo_id == current_user.id,
        DuoMember.duo_id == DuoProfile.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Duo member not found")

    photo = db.query(DuoMemberPhoto).filter_by(id=photo_id, duo_member_id=member_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    db.delete(photo)
    db.commit()
    return {"message": "Photo deleted"}



# app/api/photo_routes.py   (same file that already has upload_uno_photo)

@router.post("/upload-multiple-profile-photo")
async def upload_duo_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.profile_type not in ("duo", "group"):
        raise HTTPException(403, "Only DUO and GROUP profiles can call this endpoint")

    # ─── upload to S3 ────────────────────────────────────────────────
    s3  = boto3.client(
        "s3",
        aws_access_key_id     = os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name           = os.getenv("AWS_S3_REGION"),
    )
    ext   = file.filename.split(".")[-1]
    key   = f"profile_photos/{uuid.uuid4()}.{ext}"

    try:
        s3.upload_fileobj(
            file.file,
            os.getenv("AWS_S3_BUCKET_NAME"),
            key,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to upload: {e}")

    url = (
        f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3."
        f"{os.getenv('AWS_S3_REGION')}.amazonaws.com/{key}"
    )

    # ─── store on the profile row ────────────────────────────────────
    if current_user.profile_type == "duo":
        duo = db.query(DuoProfile).filter_by(duo_id=current_user.id).first()
        if not duo:
            duo = DuoProfile(duo_id=current_user.id)
            db.add(duo)

        duo.profile_picture = url
        db.commit()
    elif current_user.profile_type == "group":
        group = db.query(GroupProfile).filter_by(group_id=current_user.id).first()
        if not group:
            group = GroupProfile(group_id=current_user.id)
            db.add(group)

        group.profile_picture = url
        db.commit()


    return {"profile_picture": url}





@router.post("/upload-uno-profile-photo")
async def upload_uno_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.profile_type != "uno":
        raise HTTPException(403, "Only UNO profiles can call this endpoint")

    # ─── upload to S3 ────────────────────────────────────────────────
    s3  = boto3.client(
        "s3",
        aws_access_key_id     = os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name           = os.getenv("AWS_S3_REGION"),
    )
    ext   = file.filename.split(".")[-1]
    key   = f"profile_photos/{uuid.uuid4()}.{ext}"

    try:
        s3.upload_fileobj(
            file.file,
            os.getenv("AWS_S3_BUCKET_NAME"),
            key,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to upload: {e}")

    url = (
        f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3."
        f"{os.getenv('AWS_S3_REGION')}.amazonaws.com/{key}"
    )

    # ─── store on the profile row ────────────────────────────────────
    uno = db.query(UnoProfile).filter_by(user_id=current_user.id).first()
    if not uno:
        uno = UnoProfile(user_id=current_user.id)
        db.add(uno)

    uno.profile_picture = url
    db.commit()

    return {"profile_picture": url}




