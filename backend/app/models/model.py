from sqlalchemy import Column, Integer, String, DateTime, func, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship, joinedload

from pydantic import BaseModel, EmailStr, validator
from app.db.database import Base
from typing import Optional, List, Union
import re

# swipe, matches, messages --------------------------------------------------------------------------

class Swipe(Base):
    __tablename__ = "swipes"
    id = Column(Integer, primary_key=True, index=True)
    swiper_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    swipee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    direction = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    swiper = relationship("User", foreign_keys=[swiper_id], backref="swipes_made")
    swipee = relationship("User", foreign_keys=[swipee_id], backref="swipes_received")

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user1 = relationship("User", foreign_keys=[user1_id], backref="matches_as_user1")
    user2 = relationship("User", foreign_keys=[user2_id], backref="matches_as_user2")
    __table_args__ = (UniqueConstraint("user1_id", "user2_id", name="unique_match"),)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

# base user --------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(nullable=True)
    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    profile_type: Mapped[str] = mapped_column(default="uno")
    is_verified: Mapped[bool] = mapped_column(default=False)
    verification_code: Mapped[Optional[str]] = mapped_column(nullable=True)
    uno_profile = relationship("UnoProfile", back_populates="user", uselist=False)
    group_members = relationship("GroupMember", back_populates="group")
    user_photos = relationship("UserPhoto", back_populates="user", cascade="all, delete")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    profile_type: str = "uno"
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    ethnicity: Optional[List[str]] = None
    social_media_use: Optional[int] = None
    personality: Optional[List[str]] = None
    occupation: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    past_activities: Optional[List[str]] = None
    looking_for: Optional[str] = None
    @validator('email')
    def validate_email(cls, v):
        if not re.match(r"[^@]+@[^@]+\\.[^@]+", v):
            raise ValueError('Please provide a valid email')
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[List[str]] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    profile_picture: Optional[str] = None
    profile_type: Optional[str] = None
    ethnicity: Optional[List[str]] = None
    social_media_use: Optional[int] = None
    past_activities: Optional[List[str]] = None
    personality: Optional[List[str]] = None
    occupation: Optional[List[str]] = None

class EmailRequest(BaseModel):
    email: str

class UserPhoto(Base):
    __tablename__ = "user_photos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    photo_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="user_photos")

# You can now use joinedload(User.user_photos) in your /recommendations query to fetch all photo URLs




# group ----------------------------------------------------------------------------------
class GroupMember(Base):
    __tablename__ = "group_members"
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("users.id"))
    group_profile_id = Column(Integer, ForeignKey("group_profiles.id"))
    name = Column(String)
    age = Column(Integer)
    gender = Column(String, nullable=True)
    ethnicity = Column(ARRAY(String), nullable=True)
    personality = Column(ARRAY(String), nullable=True)
    occupation = Column(ARRAY(String), nullable=True)
    group = relationship("User", back_populates="group_members")
    photos = relationship("GroupMemberPhoto", back_populates="group_member", cascade="all, delete")
    group_profile = relationship("GroupProfile", back_populates="members")
    
class GroupMemberInput(BaseModel):
    name:        str
    age:         int
    profile_photo: Optional[str] = None
    gender:      Optional[str] = None
    ethnicity:   Optional[Union[str, List[str]]] = []
    personality: List[str] = []
    occupation:  List[str] = []

    @validator('ethnicity', pre=True)
    def ensure_list(cls, v):
        if isinstance(v, str):
            return [v]
        return v

class GroupMemberPhoto(Base):
    __tablename__ = "group_member_photos"
    id = Column(Integer, primary_key=True, index=True)
    group_member_id = Column(Integer, ForeignKey("group_members.id", ondelete="CASCADE"), nullable=False)
    photo_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    group_member = relationship("GroupMember", back_populates="photos")


class GroupProfileInput(BaseModel):
    profile_picture: Optional[str] = None
    location: Optional[str] = None
    looking_for: Optional[str] = None
    interests: Optional[List[str]] = None
    past_activities: Optional[List[str]] = None
    members: List[GroupMemberInput]

class DuoProfileInput(BaseModel):
    profile_picture: Optional[str] = None
    location: Optional[str] = None
    interests: Optional[List[str]] = None
    occupation: Optional[List[str]] = None
    looking_for: Optional[str] = None
    past_activities: Optional[List[str]] = None
    members: List[GroupMemberInput]

class GroupProfile(Base):
    __tablename__ = "group_profiles"
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("users.id"), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    shared_bio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    interests = Column(ARRAY(String), nullable=True)
    looking_for = Column(String, nullable=True)
    past_activities = Column(ARRAY(String), nullable=True)
    profile_picture = Column(String, nullable=True)
    group = relationship("User", backref="group_profile")
    members = relationship("GroupMember", back_populates="group_profile", cascade="all, delete")



# uno ----------------------------------------------------------------------------------
class UnoProfile(Base):
    __tablename__ = "uno_profiles"
    id        = Column(Integer, primary_key=True)
    user_id   = Column(Integer, ForeignKey("users.id"), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    profile_picture = Column(String, nullable=True)
    age          = Column(Integer)
    gender       = Column(String)
    bio          = Column(String)
    location     = Column(String)
    occupation   = Column(ARRAY(String))
    ethnicity    = Column(ARRAY(String))
    personality  = Column(ARRAY(String))
    past_activities = Column(ARRAY(String))
    social_media_use = Column(Integer)
    interests    = Column(ARRAY(String))

    user = relationship("User", back_populates="uno_profile")




# duo ----------------------------------------------------------------------------------
class DuoProfile(Base):
    __tablename__ = "duo_profiles"
    id      = Column(Integer, primary_key=True)
    duo_id  = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    profile_picture = Column(String, nullable=True)
    shared_bio      = Column(String)
    location        = Column(String)
    looking_for     = Column(String)
    interests       = Column(ARRAY(String))
    past_activities = Column(ARRAY(String))
    members = relationship("DuoMember", back_populates="duo",
                           cascade="all, delete")

class DuoMember(Base):
    __tablename__ = "duo_members"
    id = Column(Integer, primary_key=True)
    duo_id = Column(Integer, ForeignKey("duo_profiles.id"))
    duo_member_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    ethnicity = Column(ARRAY(String))
    personality = Column(ARRAY(String))
    occupation = Column(ARRAY(String))
    photos = relationship("DuoMemberPhoto", back_populates="duo_member", cascade="all, delete")
    duo = relationship("DuoProfile", back_populates="members")

class DuoMemberPhoto(Base):
    __tablename__ = "duo_member_photos"
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    duo_member_id = Column(Integer, ForeignKey("duo_members.id", ondelete="CASCADE"))
    photo_url = Column(String, nullable=False)
    duo_member = relationship("DuoMember", back_populates="photos")