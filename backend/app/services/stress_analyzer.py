from typing import Dict, List, Any
import numpy as np
from datetime import datetime
import hashlib
import json
import random
import math


class StressAnalyzer:
    def __init__(self, weights: Dict[str, float], bias: float = -3.5):
        self.weights = weights
        self.bias = bias

    def _split_posts(self, posts: list) -> tuple:
        if len(posts) < 2:
            return posts, posts
        mid = len(posts) // 2
        return posts[:mid], posts[mid:]

    def calc_activity_change(self, data: Dict[str, Any]) -> float:
        posts = data.get('posts', [])
        if len(posts) < 3:
            return random.uniform(0.01, 0.08)
        older, recent = self._split_posts(posts)
        a_base = len(older)
        a_current = len(recent)
        if a_base == 0:
            return 0.0
        x1 = max(0.0, (a_base - a_current) / a_base)
        return float(np.clip(x1, 0, 1))

    def calc_sentiment(self, sentiment_data: List[Dict[str, float]]) -> float:
        if not sentiment_data:
            return random.uniform(0.01, 0.08)
        mid = len(sentiment_data) // 2
        if mid == 0:
            e_current = np.mean([s.get('negative', 0.33) for s in sentiment_data])
            return float(np.clip(max(0.0, e_current), 0, 1))
        baseline = sentiment_data[:mid]
        current = sentiment_data[mid:]
        e_base = np.mean([s.get('positive', 0.33) - s.get('negative', 0.33) for s in baseline])
        e_curr = np.mean([s.get('positive', 0.33) - s.get('negative', 0.33) for s in current])
        x2 = max(0.0, e_base - e_curr)
        return float(np.clip(x2, 0, 1))

    def calc_social_connections(self, data: Dict[str, Any]) -> float:
        posts = data.get('posts', [])
        if len(posts) < 2:
            return random.uniform(0.01, 0.08)
        followers = max(1, data.get('followers', 1000))
        older, recent = self._split_posts(posts)
        def density(plist):
            total_interactions = sum(
                p.get('likes', 0) + p.get('comments', 0) * 2 + p.get('shares', 0) * 3
                for p in plist
            )
            return total_interactions / (followers * len(plist)) if plist else 0
        rho_base = density(older)
        rho_curr = density(recent)
        if rho_base == 0:
            return random.uniform(0.1, 0.3)
        x3 = (rho_base - rho_curr) / rho_base
        return float(np.clip(max(0.0, x3), 0, 1))

    def calc_sleep_pattern(self, data: Dict[str, Any]) -> float:
        posts = data.get('posts', [])
        if len(posts) < 2:
            return random.uniform(0.01, 0.05)
        night_count = 0
        for post in posts:
            ts = post.get('timestamp', '')
            hour = None
            if isinstance(ts, str):
                try:
                    hour = datetime.fromisoformat(ts.replace('Z', '+00:00')).hour
                except Exception:
                    pass
            elif isinstance(ts, (int, float)):
                try:
                    hour = datetime.fromtimestamp(ts).hour
                except Exception:
                    pass
            if hour is not None and (0 <= hour <= 6):
                night_count += 1
        x4 = night_count / len(posts)
        return float(np.clip(x4, 0, 1))

    def calc_geolocation(self, data: Dict[str, Any]) -> float:
        locations = data.get('locations', [])
        if not locations:
            return random.uniform(0.05, 0.15)
        unique = len(set(locations))
        total = max(1, len(locations))
        diversity = unique / total
        isolation = 0.0 if unique > 1 else 0.5
        x5 = 0.5 * (1 - diversity) + 0.5 * isolation
        return float(np.clip(x5, 0, 1))

    def calc_academic_content(self, data: Dict[str, Any]) -> float:
        posts = data.get('posts', [])
        if not posts:
            return random.uniform(0.01, 0.08)
        academic_keywords = [
            'учеба', 'университет', 'школа', 'студент', 'экзамен',
            'сессия', 'зачёт', 'зачет', 'курсовая', 'диплом', 'домашка',
            'домашнее задание', 'олимпиада', 'контрольная', 'егэ',
            'подготовка', 'дедлайн', 'учитель', 'преподаватель',
            'study', 'university', 'exam', 'homework', 'school',
        ]
        negative_keywords = [
            'устал', 'не могу', 'тяжело', 'достало', 'ненавижу',
            'не выучил', 'не готов', 'провал', 'оценка', 'тройка',
            'не нравится', 'плохо', 'стресс', 'паника', 'боюсь',
            'выжимает', 'зашкаливает',
        ]
        mention_count = 0
        negative_count = 0
        for post in posts:
            text = post.get('text', '').lower()
            is_academic = any(kw in text for kw in academic_keywords)
            is_negative = any(kw in text for kw in negative_keywords)
            if is_academic:
                mention_count += 1
                if is_negative:
                    negative_count += 1
            elif is_negative:
                mention_count += 1
                negative_count += 1
        freq = mention_count / len(posts)
        neg_ratio = negative_count / max(1, mention_count) if mention_count > 0 else 0
        x7 = 0.5 * freq + 0.5 * neg_ratio
        return float(np.clip(x7, 0, 1))

    def calc_social_recognition(self, data: Dict[str, Any]) -> float:
        posts = data.get('posts', [])
        if len(posts) < 2:
            return random.uniform(0.01, 0.08)
        older, recent = self._split_posts(posts)
        def response(plist):
            return sum(
                p.get('likes', 0) + p.get('comments', 0) * 2 + p.get('shares', 0) * 3
                for p in plist
            )
        r_base = response(older)
        r_curr = response(recent)
        if r_base == 0:
            return random.uniform(0.1, 0.3)
        x6 = max(0.0, (r_base - r_curr) / r_base)
        return float(np.clip(x6, 0, 1))

    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        components = {
            'activity_change': self.calc_activity_change(data),
            'sentiment': self.calc_sentiment(data.get('sentiments', [])),
            'social_interactions': self.calc_social_connections(data),
            'time_patterns': self.calc_sleep_pattern(data),
            'geolocation': self.calc_geolocation(data),
            'academic_mentions': self.calc_academic_content(data),
            'social_feedback': self.calc_social_recognition(data),
        }

        z = self.bias + sum(self.weights[k] * components[k] for k in self.weights)
        normalized_score = float(1 / (1 + math.exp(-z)))
        normalized_score = float(np.clip(normalized_score, 0, 1))
        stress_score = float(z)

        raw_data_str = json.dumps(data, sort_keys=True, default=str)
        raw_data_hash = hashlib.sha256(raw_data_str.encode()).hexdigest()

        radar_chart_data = {
            'Изменение активности': round(components['activity_change'] * 100, 1),
            'Тональность': round(components['sentiment'] * 100, 1),
            'Социальные связи': round(components['social_interactions'] * 100, 1),
            'Временные паттерны': round(components['time_patterns'] * 100, 1),
            'Геолокация': round(components['geolocation'] * 100, 1),
            'Академич. упоминания': round(components['academic_mentions'] * 100, 1),
            'Обратная связь': round(components['social_feedback'] * 100, 1),
        }

        return {
            'stress_score': stress_score,
            'normalized_score': normalized_score,
            'component_scores': components,
            'raw_data_hash': raw_data_hash,
            'radar_chart_data': radar_chart_data,
            'time_series_data': [],
        }


def get_default_stress_analyzer() -> StressAnalyzer:
    from app.core.config import settings
    return StressAnalyzer(settings.STRESS_WEIGHTS, settings.SIGMOID_BIAS)
