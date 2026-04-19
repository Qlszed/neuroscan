from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.models import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.USER
    role_code: Optional[str] = None
    assigned_classes: Optional[List[str]] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: UserRole
    assigned_classes: Optional[List[str]]
    is_active: bool
    is_verified: bool
    consent_given: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: UserRole
    assigned_classes: Optional[List[str]]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RoleUpdate(BaseModel):
    role: UserRole
    assigned_classes: Optional[List[str]] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ConsentUpdate(BaseModel):
    consent_given: bool

class ScenarioRequest(BaseModel):
    scenario: str = Field(..., description="low_stress, medium_stress, or high_stress")
    user_id: int = Field(..., description="Target user ID")

class ProfileCreate(BaseModel):
    platform: str
    profile_url: Optional[str] = None
    is_sample_data: bool = False
    sample_data: Optional[Dict[str, Any]] = None


class ProfileResponse(BaseModel):
    id: int
    platform: str
    anonymized_id: str
    is_sample_data: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisRequest(BaseModel):
    profile_id: Optional[int] = None
    social_media_link: Optional[str] = None
    sample_data: Optional[Dict[str, Any]] = None
    consent_confirmed: bool = Field(..., description="User must confirm consent")


class ComponentScores(BaseModel):
    activity_change: float
    sentiment: float
    social_interactions: float
    time_patterns: float
    geolocation: Optional[float] = None
    academic_mentions: float
    social_feedback: float


class AnalysisResponse(BaseModel):
    id: int
    stress_score: float
    normalized_score: float
    component_scores: ComponentScores
    radar_chart_data: Dict[str, float]
    time_series_data: List[Dict[str, Any]]
    processed_at: datetime


class AnalysisHistoryResponse(BaseModel):
    id: int
    stress_score: float
    normalized_score: float
    platform: str
    processed_at: datetime

    class Config:
        from_attributes = True


class GroupStressSummary(BaseModel):
    class_name: str
    student_count: int
    avg_stress: float
    low_count: int
    moderate_count: int
    high_count: int


class AssignedStudentResult(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str]
    normalized_score: float
    component_scores: Optional[ComponentScores] = None
    processed_at: datetime


class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
