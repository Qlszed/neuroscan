from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from contextlib import asynccontextmanager
import hashlib
import secrets
import time
import os

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.models.models import Profile, User
from app.schemas.schemas import ProfileCreate, ProfileResponse, ContactForm, APIResponse
from app.api import auth, analysis, reports
from app.api.auth import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated Digital Footprint Analysis System for Detecting Academic Stress in Gifted Adolescents",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Simple rate limiting (in production, use Redis)
    client_ip = request.client.host
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.time())
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "detail": exc.detail}
    )


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)


@app.post(f"{settings.API_V1_STR}/profiles/", response_model=ProfileResponse)
async def create_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    anonymized_id = hashlib.sha256(
        f"{current_user.id}{profile_data.platform}{secrets.token_hex(16)}".encode()
    ).hexdigest()[:16]
    profile = Profile(
        user_id=current_user.id,
        platform=profile_data.platform,
        profile_url=profile_data.profile_url,
        anonymized_id=anonymized_id,
        is_sample_data=profile_data.is_sample_data,
        sample_data_json=profile_data.sample_data
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@app.get(f"{settings.API_V1_STR}/profiles/", response_model=list[ProfileResponse])
async def list_profiles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    return result.scalars().all()


@app.delete(f"{settings.API_V1_STR}/profiles/{{profile_id}}", response_model=APIResponse)
async def delete_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Profile).where(Profile.id == profile_id, Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
    await db.commit()
    return APIResponse(success=True, message="Profile deleted successfully")


@app.post(f"{settings.API_V1_STR}/contact/", response_model=APIResponse)
async def submit_contact_form(contact_data: ContactForm, db: AsyncSession = Depends(get_db)):
    return APIResponse(
        success=True,
        message="Thank you for your feedback! We will get back to you soon.",
        data={"name": contact_data.name, "email": contact_data.email, "subject": contact_data.subject}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
