
# model.py

from sqlalchemy import Column, Integer, String, DateTime, func, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pydantic import BaseModel, EmailStr, validator
from database import Base
from typing import Optional
import re 


# swipe op

class Swipe(Base):
    __tablename__ = "swipes"

    id = Column(Integer, primary_key=True, index=True)
    swiper_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    swipee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    direction = Column(String, nullable=False)  # 'left' or 'right'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    swiper = relationship("User", foreign_keys=[swiper_id], backref="swipes_made")
    swipee = relationship("User", foreign_keys=[swipee_id], backref="swipes_received")


# if match

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user1 = relationship("User", foreign_keys=[user1_id], backref="matches_as_user1")
    user2 = relationship("User", foreign_keys=[user2_id], backref="matches_as_user2")

    __table_args__ = (UniqueConstraint("user1_id", "user2_id", name="unique_match"),)


# base user (uno)
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(nullable=True)
    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)

    # NEW FIELDS
    bio: Mapped[Optional[str]] = mapped_column(nullable=True)
    interests: Mapped[Optional[str]] = mapped_column(nullable=True)
    age: Mapped[Optional[int]] = mapped_column(nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(nullable=True)
    location: Mapped[Optional[str]] = mapped_column(nullable=True)
    profile_photo: Mapped[Optional[str]] = mapped_column(nullable=True)
    height: Mapped[Optional[float]] = mapped_column(nullable=True)
    profile_type: Mapped[str] = mapped_column(default="uno")  # uno, duo, group
    
    #code verification
    is_verified: Mapped[bool] = mapped_column(default=False)
    verification_code: Mapped[Optional[str]] = mapped_column(nullable=True)

# base user (group / duo)
class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("users.id"))  # links to primary user
    name = Column(String)
    age = Column(Integer)
    profile_photo = Column(String, nullable=True)

    group = relationship("User", backref="members")




class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    profile_type: str = "uno"
    @validator('email')
    def validate_email(cls, v):
        if not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError('Please provide a valid email')
        return v

class UserUpdate(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    profile_photo: Optional[str] = None
    height: Optional[float] = None
    profile_type: Optional[str] = None



class EmailRequest(BaseModel):
    email: str