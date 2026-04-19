import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PSYCHOLOGIST = "psychologist"
    CURATOR = "curator"
    USER = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    assigned_classes = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    consent_given = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profiles = relationship("Profile", back_populates="user")
    analysis_results = relationship("AnalysisResult", back_populates="user")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String(50), nullable=False)
    profile_url = Column(Text, nullable=True)
    anonymized_id = Column(String(64), unique=True, index=True)
    is_sample_data = Column(Boolean, default=False)
    sample_data_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="profiles")
    analysis_results = relationship("AnalysisResult", back_populates="profile")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=True)

    stress_score = Column(Float, nullable=False)
    normalized_score = Column(Float, nullable=False)

    activity_change_score = Column(Float)
    sentiment_score = Column(Float)
    social_interactions_score = Column(Float)
    time_patterns_score = Column(Float)
    geolocation_score = Column(Float)
    academic_mentions_score = Column(Float)
    social_feedback_score = Column(Float)

    raw_data_hash = Column(String(64))
    processed_at = Column(DateTime, default=datetime.utcnow)

    radar_chart_data = Column(JSON)
    time_series_data = Column(JSON)

    user = relationship("User", back_populates="analysis_results")
    profile = relationship("Profile", back_populates="analysis_results")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
