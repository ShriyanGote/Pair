from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import User
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

@router.post("/upload-profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_S3_REGION")
    )
    extension = file.filename.split(".")[-1]
    unique_filename = f"profile_photos/{uuid.uuid4()}.{extension}"
    s3.upload_fileobj(
        file.file,
        os.getenv("AWS_S3_BUCKET_NAME"),
        unique_filename,
        ExtraArgs={"ContentType": file.content_type},
    )
    url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{unique_filename}"
    current_user.profile_photo = url
    db.commit()
    return {"photo_url": url}