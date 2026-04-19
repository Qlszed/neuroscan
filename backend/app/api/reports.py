from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timedelta
import random
import math

from app.core.database import get_db
from app.core.permissions import require_role, require_permission, Permissions
from app.models.models import AnalysisResult, User, UserRole
from app.schemas.schemas import (
    AnalysisResponse, ComponentScores, GroupStressSummary,
    AssignedStudentResult, APIResponse, ScenarioRequest
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/psychologist/students", response_model=List[AssignedStudentResult])
async def get_assigned_students_results(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not Permissions.has_permission(current_user.role, "analysis:read_assigned"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    assigned_classes = current_user.assigned_classes or []

    stmt = (
        select(User, AnalysisResult)
        .join(AnalysisResult, User.id == AnalysisResult.user_id)
        .order_by(AnalysisResult.processed_at.desc())
    )

    if current_user.role == UserRole.PSYCHOLOGIST and assigned_classes:
        stmt = stmt.where(User.assigned_classes != None)
    elif current_user.role == UserRole.PSYCHOLOGIST and not assigned_classes:
        raise HTTPException(status_code=400, detail="No classes assigned to this psychologist")

    results = await db.execute(stmt)
    rows = results.all()

    response = []
    for user, analysis in rows:
        user_classes = user.assigned_classes or []
        if assigned_classes and not any(c in assigned_classes for c in user_classes):
            continue

        response.append(AssignedStudentResult(
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            normalized_score=analysis.normalized_score,
            component_scores=ComponentScores(
                activity_change=analysis.activity_change_score,
                sentiment=analysis.sentiment_score,
                social_interactions=analysis.social_interactions_score,
                time_patterns=analysis.time_patterns_score,
                geolocation=analysis.geolocation_score,
                academic_mentions=analysis.academic_mentions_score,
                social_feedback=analysis.social_feedback_score,
            ),
            processed_at=analysis.processed_at,
        ))

    return response


@router.get("/psychologist/students/{student_id}/latest", response_model=AnalysisResponse)
async def get_student_latest_result(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not Permissions.has_permission(current_user.role, "analysis:read_assigned"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == UserRole.PSYCHOLOGIST:
        assigned_classes = current_user.assigned_classes or []
        student_classes = student.assigned_classes or []
        if assigned_classes and not any(c in assigned_classes for c in student_classes):
            raise HTTPException(status_code=403, detail="Student not in your assigned classes")

    result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == student_id)
        .order_by(AnalysisResult.processed_at.desc())
        .limit(1)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis results for this student")

    return AnalysisResponse(
        id=analysis.id,
        stress_score=analysis.stress_score,
        normalized_score=analysis.normalized_score,
        component_scores=ComponentScores(
            activity_change=analysis.activity_change_score,
            sentiment=analysis.sentiment_score,
            social_interactions=analysis.social_interactions_score,
            time_patterns=analysis.time_patterns_score,
            geolocation=analysis.geolocation_score,
            academic_mentions=analysis.academic_mentions_score,
            social_feedback=analysis.social_feedback_score,
        ),
        radar_chart_data=analysis.radar_chart_data,
        time_series_data=analysis.time_series_data,
        processed_at=analysis.processed_at,
    )


@router.get("/curator/group-summary", response_model=List[GroupStressSummary])
async def get_group_stress_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not Permissions.has_permission(current_user.role, "analysis:read_group_summary"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    assigned_classes = current_user.assigned_classes or []
    if not assigned_classes:
        raise HTTPException(status_code=400, detail="No classes assigned")

    summaries = []
    for class_name in assigned_classes:
        stmt = select(User).where(User.assigned_classes.contains([class_name]))
        result = await db.execute(stmt)
        students = result.scalars().all()

        if not students:
            continue

        student_ids = [s.id for s in students]

        latest_results_stmt = (
            select(AnalysisResult)
            .where(AnalysisResult.user_id.in_(student_ids))
            .order_by(AnalysisResult.user_id, AnalysisResult.processed_at.desc())
        )
        results = await db.execute(latest_results_stmt)
        all_results = results.scalars().all()

        seen_users = set()
        latest_per_user = []
        for r in all_results:
            if r.user_id not in seen_users:
                seen_users.add(r.user_id)
                latest_per_user.append(r)

        if not latest_per_user:
            summaries.append(GroupStressSummary(
                class_name=class_name,
                student_count=len(students),
                avg_stress=0.0,
                low_count=len(students),
                moderate_count=0,
                high_count=0,
            ))
            continue

        scores = [r.normalized_score for r in latest_per_user]
        avg = sum(scores) / len(scores)

        low = sum(1 for s in scores if s < 0.3)
        moderate = sum(1 for s in scores if 0.3 <= s < 0.7)
        high = sum(1 for s in scores if s >= 0.7)

        summaries.append(GroupStressSummary(
            class_name=class_name,
            student_count=len(students),
            avg_stress=round(avg, 3),
            low_count=low,
            moderate_count=moderate,
            high_count=high,
        ))

    return summaries


@router.get("/admin/all-results", response_model=List[AssignedStudentResult])
async def get_all_results_admin(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not Permissions.has_permission(current_user.role, "analysis:read_all"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = (
        select(User, AnalysisResult)
        .join(AnalysisResult, User.id == AnalysisResult.user_id)
        .order_by(AnalysisResult.processed_at.desc())
        .limit(200)
    )
    results = await db.execute(stmt)
    rows = results.all()

    response = []
    for user, analysis in rows:
        response.append(AssignedStudentResult(
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            normalized_score=analysis.normalized_score,
            processed_at=analysis.processed_at,
        ))

    return response


@router.get("/admin/logs", response_model=List[dict])
async def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not Permissions.has_permission(current_user.role, "logs:read"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    from app.models.models import AuditLog
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100)
    )
    logs = result.scalars().all()

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource": log.resource,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


SCENARIOS = {
    "low_stress": {
        "components": {
            "activity_change": (0.02, 0.10),
            "sentiment": (0.01, 0.08),
            "social_interactions": (0.02, 0.10),
            "time_patterns": (0.01, 0.05),
            "geolocation": (0.05, 0.15),
            "academic_mentions": (0.02, 0.08),
            "social_feedback": (0.01, 0.10),
        },
        "target_score": 0.20,
        "trend": "decreasing",
    },
    "medium_stress": {
        "components": {
            "activity_change": (0.15, 0.35),
            "sentiment": (0.25, 0.45),
            "social_interactions": (0.15, 0.35),
            "time_patterns": (0.10, 0.25),
            "geolocation": (0.15, 0.30),
            "academic_mentions": (0.25, 0.45),
            "social_feedback": (0.15, 0.30),
        },
        "target_score": 0.50,
        "trend": "fluctuating",
    },
    "high_stress": {
        "components": {
            "activity_change": (0.55, 0.80),
            "sentiment": (0.70, 0.95),
            "social_interactions": (0.50, 0.75),
            "time_patterns": (0.40, 0.60),
            "geolocation": (0.35, 0.55),
            "academic_mentions": (0.60, 0.85),
            "social_feedback": (0.45, 0.65),
        },
        "target_score": 0.85,
        "trend": "spiking",
    },
}

WEIGHTS = {
    "activity_change": 1.8,
    "sentiment": 2.8,
    "social_interactions": 2.2,
    "time_patterns": 1.5,
    "geolocation": 1.2,
    "academic_mentions": 2.0,
    "social_feedback": 1.4,
}

SIGMOID_BIAS = -3.25


def _sigmoid(z):
    return 1 / (1 + math.exp(-z))


def _generate_trend(scenario_key: str, target: float) -> list:
    cfg = SCENARIOS[scenario_key]
    now = datetime.utcnow()
    points = []
    n_points = random.randint(4, 7)

    if cfg["trend"] == "decreasing":
        start = target + 0.25
        for i in range(n_points):
            week_ago = now - timedelta(weeks=n_points - i)
            progress = i / max(n_points - 1, 1)
            base = start - (start - target) * progress
            noise = random.uniform(-0.04, 0.04)
            val = max(0, min(1, base + noise))
            points.append({"date": week_ago.strftime("%Y-%m-%d"), "stress": round(val, 3)})

    elif cfg["trend"] == "spiking":
        base = target * 0.45
        for i in range(n_points):
            week_ago = now - timedelta(weeks=n_points - i)
            if i < n_points - 2:
                val = base + random.uniform(-0.05, 0.05)
            elif i == n_points - 2:
                val = target * 0.7 + random.uniform(-0.03, 0.03)
            else:
                val = target + random.uniform(-0.03, 0.03)
            val = max(0, min(1, val))
            points.append({"date": week_ago.strftime("%Y-%m-%d"), "stress": round(val, 3)})

    else:  # fluctuating
        for i in range(n_points):
            week_ago = now - timedelta(weeks=n_points - i)
            val = target + random.uniform(-0.12, 0.12)
            val = max(0, min(1, val))
            points.append({"date": week_ago.strftime("%Y-%m-%d"), "stress": round(val, 3)})

    return points


@router.post("/admin/scenarios", response_model=APIResponse)
async def create_scenario(
    req: ScenarioRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not Permissions.has_permission(current_user.role, "roles:assign"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    if req.scenario not in SCENARIOS:
        raise HTTPException(status_code=400, detail="Invalid scenario. Use: low_stress, medium_stress, high_stress")

    result = await db.execute(select(User).where(User.id == req.user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    cfg = SCENARIOS[req.scenario]

    comp = {}
    for key, (lo, hi) in cfg["components"].items():
        comp[key] = round(random.uniform(lo, hi), 3)

    z = SIGMOID_BIAS + sum(WEIGHTS[k] * comp[k] for k in WEIGHTS)
    normalized_score = round(_sigmoid(z), 3)

    radar_chart_data = {
        "Изменение активности": round(comp["activity_change"] * 100, 1),
        "Тональность": round(comp["sentiment"] * 100, 1),
        "Социальные связи": round(comp["social_interactions"] * 100, 1),
        "Временные паттерны": round(comp["time_patterns"] * 100, 1),
        "Геолокация": round(comp["geolocation"] * 100, 1),
        "Академич. упоминания": round(comp["academic_mentions"] * 100, 1),
        "Обратная связь": round(comp["social_feedback"] * 100, 1),
    }

    time_series_data = _generate_trend(req.scenario, normalized_score)

    now = datetime.utcnow()
    for i, ts_point in enumerate(time_series_data):
        try:
            d = datetime.strptime(ts_point["date"], "%Y-%m-%d")
        except ValueError:
            d = now - timedelta(weeks=len(time_series_data) - i)
        d = d.replace(hour=random.randint(8, 18), minute=random.randint(0, 59))

        db_result = AnalysisResult(
            user_id=target_user.id,
            profile_id=None,
            stress_score=round(z, 3),
            normalized_score=ts_point["stress"],
            activity_change_score=comp["activity_change"],
            sentiment_score=comp["sentiment"],
            social_interactions_score=comp["social_interactions"],
            time_patterns_score=comp["time_patterns"],
            geolocation_score=comp["geolocation"],
            academic_mentions_score=comp["academic_mentions"],
            social_feedback_score=comp["social_feedback"],
            raw_data_hash="scenario_" + req.scenario,
            radar_chart_data=radar_chart_data,
            time_series_data=[],
            processed_at=d,
        )
        db.add(db_result)

    await db.commit()

    return APIResponse(
        success=True,
        message=f"Сценарий '{req.scenario}' создан для пользователя {target_user.username}",
        data={"normalized_score": normalized_score, "points_count": len(time_series_data)}
    )
