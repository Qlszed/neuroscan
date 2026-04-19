from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.models import AnalysisResult, Profile, User, AuditLog, UserRole
from app.schemas.schemas import AnalysisRequest, AnalysisResponse, AnalysisHistoryResponse, APIResponse, ComponentScores
from app.services.sentiment_analyzer import sentiment_analyzer
from app.services.stress_analyzer import get_default_stress_analyzer
from app.api.auth import get_current_user

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/", response_model=AnalysisResponse)
async def analyze_digital_footprint(
    analysis_request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=403,
            detail="Анализ профиля доступен только ученикам. Ваша роль предназначена для просмотра статистики."
        )

    if not analysis_request.consent_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Consent must be confirmed before analysis"
        )

    if not current_user.consent_given:
        raise HTTPException(
            status_code=403,
            detail="User consent required. Please update your consent settings."
        )

    profile = None
    data = {}

    if analysis_request.profile_id:
        result = await db.execute(
            select(Profile).where(
                Profile.id == analysis_request.profile_id,
                Profile.user_id == current_user.id
            )
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        if profile.is_sample_data:
            data = profile.sample_data_json or {}
        else:
            raise HTTPException(
                status_code=400,
                detail="Live social media scraping not yet implemented. Please use sample data."
            )
    elif analysis_request.sample_data:
        data = analysis_request.sample_data
    else:
        raise HTTPException(
            status_code=400,
            detail="Either profile_id or sample_data must be provided"
        )

    texts = [post.get('text', '') for post in data.get('posts', [])]
    sentiments = sentiment_analyzer.analyze_sentiment(texts)
    data['sentiments'] = sentiments

    stress_analyzer = get_default_stress_analyzer()
    analysis_result = stress_analyzer.analyze(data)

    db_result = AnalysisResult(
        user_id=current_user.id,
        profile_id=profile.id if profile else None,
        stress_score=analysis_result['stress_score'],
        normalized_score=analysis_result['normalized_score'],
        activity_change_score=analysis_result['component_scores']['activity_change'],
        sentiment_score=analysis_result['component_scores']['sentiment'],
        social_interactions_score=analysis_result['component_scores']['social_interactions'],
        time_patterns_score=analysis_result['component_scores']['time_patterns'],
        geolocation_score=analysis_result['component_scores']['geolocation'],
        academic_mentions_score=analysis_result['component_scores']['academic_mentions'],
        social_feedback_score=analysis_result['component_scores']['social_feedback'],
        raw_data_hash=analysis_result['raw_data_hash'],
        radar_chart_data=analysis_result['radar_chart_data'],
        time_series_data=analysis_result['time_series_data'],
        processed_at=datetime.utcnow()
    )

    db.add(db_result)
    await db.commit()
    await db.refresh(db_result)

    log = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        resource="analysis_result",
        details={"result_id": db_result.id}
    )
    db.add(log)
    await db.commit()

    history_result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == current_user.id)
        .order_by(AnalysisResult.processed_at.asc())
    )
    all_results = history_result.scalars().all()
    time_series_data = [
        {
            'date': r.processed_at.strftime('%Y-%m-%d'),
            'stress': r.normalized_score,
        }
        for r in all_results
    ]

    return AnalysisResponse(
        id=db_result.id,
        stress_score=db_result.stress_score,
        normalized_score=db_result.normalized_score,
        component_scores=ComponentScores(
            activity_change=db_result.activity_change_score,
            sentiment=db_result.sentiment_score,
            social_interactions=db_result.social_interactions_score,
            time_patterns=db_result.time_patterns_score,
            geolocation=db_result.geolocation_score,
            academic_mentions=db_result.academic_mentions_score,
            social_feedback=db_result.social_feedback_score
        ),
        radar_chart_data=db_result.radar_chart_data,
        time_series_data=time_series_data,
        processed_at=db_result.processed_at
    )


@router.get("/history", response_model=List[AnalysisHistoryResponse])
async def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AnalysisResult, Profile.platform)
        .join(Profile, AnalysisResult.profile_id == Profile.id, isouter=True)
        .where(AnalysisResult.user_id == current_user.id)
        .order_by(AnalysisResult.processed_at.desc())
        .limit(50)
    )

    history = []
    for row in result.all():
        analysis = row[0]
        platform = row[1] if len(row) > 1 else "Sample Data"
        history.append(AnalysisHistoryResponse(
            id=analysis.id,
            stress_score=analysis.stress_score,
            normalized_score=analysis.normalized_score,
            platform=platform or "Sample Data",
            processed_at=analysis.processed_at
        ))

    return history


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis_result(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AnalysisResult).where(
            AnalysisResult.id == analysis_id,
            AnalysisResult.user_id == current_user.id
        )
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    history_result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == current_user.id)
        .order_by(AnalysisResult.processed_at.asc())
    )
    all_results = history_result.scalars().all()
    time_series_data = [
        {'date': r.processed_at.strftime('%Y-%m-%d'), 'stress': r.normalized_score}
        for r in all_results
    ]

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
            social_feedback=analysis.social_feedback_score
        ),
        radar_chart_data=analysis.radar_chart_data,
        time_series_data=time_series_data,
        processed_at=analysis.processed_at
    )


@router.delete("/{analysis_id}", response_model=APIResponse)
async def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AnalysisResult).where(
            AnalysisResult.id == analysis_id,
            AnalysisResult.user_id == current_user.id
        )
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    await db.delete(analysis)
    await db.commit()

    return APIResponse(success=True, message="Analysis deleted successfully")
