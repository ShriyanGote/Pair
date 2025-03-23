from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from model import User, UserCreate, UserLogin, UserUpdate
import uvicorn
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import create_user, get_user_by_email, verify_password
from auth import create_access_token, decode_access_token
from datetime import timedelta

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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
        data={"sub": db_user.email},
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload

@app.get("/me")
def read_current_user(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

@app.get("/users")
def get_users():
    return [{"id": 1, "name": "Sanjana"}, {"id": 2, "name": "Shriyan"}]

@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"id": user_id, "name": "User Placeholder"}

@app.get("/matches/{user_id}")
def get_matches(user_id: int):
    return {"user_id": user_id, "matches": [2, 3, 5]}

@app.put("/users/{user_id}")
def update_user_profile(user_id: int, updated_data: UserUpdate, db: Session = Depends(get_db)):
    return {"message": f"temorary response for updating user {user_id}"}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

