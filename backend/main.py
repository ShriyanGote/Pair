#main.py

from fastapi import FastAPI, Depends, HTTPException, Header, Request, APIRouter, Body, UploadFile, File

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import uvicorn
import os
import random
import boto3
import uuid


from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from database import SessionLocal
from model import User, UserCreate, UserLogin, UserUpdate, EmailRequest, Swipe
from crud import create_user, get_user_by_email, verify_password
from auth import create_access_token, decode_access_token
from datetime import timedelta

from swipe_routes import router as swipe_router
from google_auth import router as auth_router
from email_util import send_verification_email




# ------------------------------------------------
# 1) CREATE APP
# ------------------------------------------------
app = FastAPI()


# ------------------------------------------------
# 2) ADD SESSION MIDDLEWARE ONCE
# ------------------------------------------------
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ["SESSION_SECRET"],
    same_site="none",
    https_only=False
)


# ------------------------------------------------
# 3) ADD CORS MIDDLEWARE (OPTIONAL)
# ------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # or your front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------
# 4) UTILS
# ------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth dependency
def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
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

# ------------------------------------------------
# 5) DEFINE ROUTES
# ------------------------------------------------
@app.get("/")
def root():
    return {"message": "Shriyan's Dating App Backend"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, user.email)
    if existing:
        return {"error": "User already exists"}
    new_user = create_user(db, name=user.name, email=user.email, password=user.password)
    return {"message": f"User {new_user.name} registered!"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        return {"error": "Invalid email or password"}
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "age": current_user.age,
        "gender": current_user.gender,
        "location": current_user.location,
        "height": current_user.height,
        "bio": current_user.bio,
        "profile_photo": current_user.profile_photo,
    }

@app.put("/users/{user_id}")
def update_user_profile(user_id: int, updated_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = updated_data.name
    user.email = updated_data.email
    # if updated_data.password is set, we store hashed...
    if updated_data.password:
        # adapt your logic for hashing password
        user.hashed_password = updated_data.password

    user.bio = updated_data.bio
    user.age = updated_data.age
    user.gender = updated_data.gender 
    user.location = updated_data.location
    user.height = updated_data.height

    db.commit()
    db.refresh(user)
    return {"message": "User profile updated", "user": user}




email_router = APIRouter()


@email_router.post("/send-code")
def send_code(payload: EmailRequest, db: Session = Depends(get_db)):
    email = payload.email
    code = str(random.randint(100000, 999999))
    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=404, detail="No account found. Please register with Google.")

    user.verification_code = code
    db.commit()
    send_verification_email(email, code)
    return {"message": "Verification code sent"}

@email_router.post("/verify-code")
def verify_code(email: str = Body(...), code: str = Body(...), db: Session = Depends(get_db)):
    user = get_user_by_email(db, email)
    # if not user or user.verification_code != code:
    #     raise HTTPException(status_code=400, detail="Invalid verification code")

    #TESTING PURPOSES

    user.is_verified = True
    db.commit()
    token = create_access_token(data={"sub": user.email})
    return {"message": "Email verified", "access_token": token}




@app.post("/upload-profile-photo")
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
        ExtraArgs={"ContentType": file.content_type},  # removed "ACL": "public-read"
    )

    url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_S3_REGION')}.amazonaws.com/{unique_filename}"

    current_user.profile_photo = url
    db.commit()

    return {"photo_url": url}

# ------------------------------------------------
# 6) INCLUDE OTHER ROUTERS
# ------------------------------------------------
app.include_router(swipe_router)
app.include_router(auth_router)
app.include_router(email_router)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
