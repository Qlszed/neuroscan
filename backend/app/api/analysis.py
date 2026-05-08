from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.models import AnalysisResult, Profile, User, AuditLog, UserRole
from app.schemas.schemas import AnalysisRequest, AnalysisResponse, AnalysisHistoryResponse, APIResponse, ComponentScores, ScenarioComputeRequest, SentimentTestRequest, SentimentTestResponse, ManualComputeRequest
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


FIXED_SCENARIOS = {
    "low_stress": {
        "components": {
            "activity_change": 0.15,
            "sentiment": 0.18,
            "social_interactions": 0.25,
            "time_patterns": 0.15,
            "geolocation": 0.20,
            "academic_mentions": 0.25,
            "social_feedback": 0.20,
        },
        "time_series": [
            {"date": "2024-09-07", "stress": 0.25},
            {"date": "2024-09-14", "stress": 0.22},
            {"date": "2024-09-21", "stress": 0.20},
            {"date": "2024-09-28", "stress": 0.19},
            {"date": "2024-10-05", "stress": 0.19},
        ],
    },
    "medium_stress": {
        "components": {
            "activity_change": 0.30,
            "sentiment": 0.39,
            "social_interactions": 0.36,
            "time_patterns": 0.25,
            "geolocation": 0.20,
            "academic_mentions": 0.36,
            "social_feedback": 0.30,
        },
        "time_series": [
            {"date": "2024-09-07", "stress": 0.45},
            {"date": "2024-09-14", "stress": 0.58},
            {"date": "2024-09-21", "stress": 0.50},
            {"date": "2024-09-28", "stress": 0.62},
            {"date": "2024-10-05", "stress": 0.54},
            {"date": "2024-10-12", "stress": 0.54},
        ],
    },
    "high_stress": {
        "components": {
            "activity_change": 0.50,
            "sentiment": 0.64,
            "social_interactions": 0.50,
            "time_patterns": 0.40,
            "geolocation": 0.28,
            "academic_mentions": 0.50,
            "social_feedback": 0.42,
        },
        "time_series": [
            {"date": "2024-09-07", "stress": 0.45},
            {"date": "2024-09-14", "stress": 0.55},
            {"date": "2024-09-21", "stress": 0.62},
            {"date": "2024-09-28", "stress": 0.78},
            {"date": "2024-10-05", "stress": 0.85},
            {"date": "2024-10-12", "stress": 0.91},
        ],
    },
}


def _compute_from_components(components: dict, time_series: list) -> dict:
    from app.core.config import settings
    import math

    weights = settings.STRESS_WEIGHTS
    bias = settings.SIGMOID_BIAS

    z = bias + sum(weights[k] * components.get(k, 0) for k in weights)
    normalized_score = max(0, min(1, 1 / (1 + math.exp(-z))))

    radar_chart_data = {
        'Изменение активности': round(components.get('activity_change', 0) * 100, 1),
        'Тональность текстов': round(components.get('sentiment', 0) * 100, 1),
        'Социальные связи': round(components.get('social_interactions', 0) * 100, 1),
        'Режим сна': round(components.get('time_patterns', 0) * 100, 1),
        'Геолокация': round(components.get('geolocation', 0) * 100, 1),
        'Академический контент': round(components.get('academic_mentions', 0) * 100, 1),
        'Социальное признание': round(components.get('social_feedback', 0) * 100, 1),
    }

    return {
        'stress_score': float(z),
        'normalized_score': normalized_score,
        'component_scores': components,
        'radar_chart_data': radar_chart_data,
        'time_series_data': time_series,
    }


@router.post("/compute", response_model=AnalysisResponse)
async def compute_scenario(
    req: ScenarioComputeRequest,
    current_user: User = Depends(get_current_user),
):
    if req.scenario not in FIXED_SCENARIOS:
        raise HTTPException(status_code=400, detail="Invalid scenario. Use: low_stress, medium_stress, high_stress")

    cfg = FIXED_SCENARIOS[req.scenario]
    result = _compute_from_components(cfg["components"], cfg["time_series"])

    return AnalysisResponse(
        id=0,
        stress_score=result['stress_score'],
        normalized_score=result['normalized_score'],
        component_scores=ComponentScores(**result['component_scores']),
        radar_chart_data=result['radar_chart_data'],
        time_series_data=result['time_series_data'],
        processed_at=datetime.utcnow()
    )


@router.post("/sentiment-test", response_model=SentimentTestResponse)
async def test_sentiment(
    req: SentimentTestRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.AUTOMATON:
        raise HTTPException(status_code=403, detail="Доступно только для роли Автомат")

    result = sentiment_analyzer._fallback_sentiment(req.text)
    method = "keywords"

    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import numpy as np

        tokenizer = AutoTokenizer.from_pretrained("blanchefort/rubert-base-cased-sentiment")
        model = AutoModelForSequenceClassification.from_pretrained("blanchefort/rubert-base-cased-sentiment")
        model.eval()

        with torch.no_grad():
            inputs = tokenizer(req.text, return_tensors="pt", truncation=True, max_length=512)
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1).squeeze().tolist()

        label_map = {0: "neutral", 1: "negative", 2: "positive"}
        result = {label_map[i]: probs[i] for i in range(3)}
        method = "rubert"
    except Exception:
        pass

    return SentimentTestResponse(
        positive=round(result.get("positive", 0.33), 3),
        neutral=round(result.get("neutral", 0.34), 3),
        negative=round(result.get("negative", 0.33), 3),
        method=method,
    )


@router.post("/manual-compute", response_model=AnalysisResponse)
async def manual_compute(
    req: ManualComputeRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.AUTOMATON:
        raise HTTPException(status_code=403, detail="Доступно только для роли Автомат")

    components = {}
    valid_keys = {"activity_change", "sentiment", "social_interactions", "time_patterns", "geolocation", "academic_mentions", "social_feedback"}
    for k in valid_keys:
        components[k] = max(0, min(1, req.components.get(k, 0)))

    if req.sentiment_text:
        sent_result = sentiment_analyzer._fallback_sentiment(req.sentiment_text)
        components["sentiment"] = max(0, min(1, sent_result.get("negative", 0.33)))

    result = _compute_from_components(components, [])

    return AnalysisResponse(
        id=0,
        stress_score=result['stress_score'],
        normalized_score=result['normalized_score'],
        component_scores=ComponentScores(**result['component_scores']),
        radar_chart_data=result['radar_chart_data'],
        time_series_data=result['time_series_data'],
        processed_at=datetime.utcnow()
    )
