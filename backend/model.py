from sqlalchemy import Column, Integer, String
from pydantic import BaseModel, EmailStr, validator
from database import Base
from typing import Optional
import re 


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    bio = Column(String, nullable=True)
    interests = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    location = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)




class UserCreate(BaseModel):
    name: str
    email: str
    password: str

    @validator('email')
    def validate_email(cls, v):
        if not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError('Please provide a valid email')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: str
    email: EmailStr
    password: str
    bio: Optional[str] = None
    interests: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    profile_photo: Optional[str] = None
