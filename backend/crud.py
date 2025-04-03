#crud.py

from sqlalchemy.orm import Session
from model import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_user(db: Session, name: str, email: str, password: str, profile_type: str = "uno"):
    hashed_password = get_password_hash(password)  # If you're not hashing, or add your hash logic
    db_user = User(
        name=name,
        email=email,
        hashed_password=hashed_password,
        profile_type=profile_type,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
