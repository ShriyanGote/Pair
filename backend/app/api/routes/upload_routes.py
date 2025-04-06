from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import User, UserPhoto
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

# @router.post("/upload-profile-photo")
# async def upload_profile_photo(
#     file: UploadFile = File(...),
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     s3 = boto3.client(
#         "s3",
#         aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
#         aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
#         region_name=os.getenv("AWS_S3_REGION")
#     )
#     extension = file.filename.split(".")[-1]
#     unique_filename = f"profile_photos/{uuid.uuid4()}.{extension}"
#     s3.upload_fileobj(
#         file.file,
#         os.getenv("AWS_S3_BUCKET_NAME"),
#         unique_filename,
#         ExtraArgs={"ContentType": file.content_type},
#     )
#     url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{unique_filename}"
#     current_user.profile_photo = url
#     db.commit()
#     return {"photo_url": url}


@router.get("/users/{user_id}/photos")
def get_user_photos(user_id: int, db: Session = Depends(get_db)):
    photos = db.query(UserPhoto).filter(UserPhoto.user_id == user_id).all()
    # Return an array of objects: each with an ID and a URL
    return [{"id": p.id, "photo_url": p.photo_url} for p in photos]


@router.post("/upload-uno-photo")
async def upload_uno_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)):
    # 1) Ensure the user is UNO profile (optional if you only want this route for UNO):
    if current_user.profile_type != 'uno':
        raise HTTPException(status_code=403, detail="This endpoint is for UNO profiles only")

    # 2) Limit check: does user already have 5 photos?
    existing_photos = db.query(UserPhoto).filter(UserPhoto.user_id == current_user.id).count()
    if existing_photos >= 5:
        raise HTTPException(status_code=400, detail="You already have 5 photos. Delete one first.")

    # 3) Upload to S3
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

    # 4) Save record
    photo_url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{unique_filename}"
    new_photo = UserPhoto(user_id=current_user.id, photo_url=photo_url)
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)

    # 5) Return new photo URL
    return {
    "photo_id": new_photo.id,
    "photo_url": photo_url }


@router.delete("/users/{user_id}/photos/{photo_id}")
def delete_user_photo(user_id: int, photo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # check ownership
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not your account")

    photo_record = db.query(UserPhoto).filter(UserPhoto.id == photo_id, UserPhoto.user_id == user_id).first()
    if not photo_record:
        raise HTTPException(status_code=404, detail="Photo not found")

    db.delete(photo_record)
    db.commit()

    return {"message": "Photo deleted"}