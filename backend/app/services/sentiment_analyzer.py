import numpy as np
import re
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    def __init__(self, model_name: str = "blanchefort/rubert-base-cased-sentiment"):
        self.model_name = model_name
        self.device = None
        self.tokenizer = None
        self.model = None
        self._loaded = False
        self.sarcasm_patterns = [
            r'\bvzh\w*\b', r'\bkek\w*\b', r'\blol\w*\b',
            r'\bха-ха\w*\b', r'\bхе-хе\w*\b',
            r'\b:\)\)\)', r'\b:\(\(\(', r'❤️‍🔥', r'‍♂️', r'‍♀️',
        ]
        self.academic_keywords = [
            'учеба', 'университет', 'школа', 'студент', 'преподаватель',
            'экзамен', 'сессия', 'зачёт', 'курсовая', 'диплом', 'домашка',
            'домашнее задание', 'олимпиада', 'контрольная', 'lection', 'study',
            'homework', 'exam', 'university', 'school'
        ]

    def _load_model(self):
        if self._loaded:
            return
        try:
            import torch
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            self._loaded = True
            logger.info(f"Sentiment model loaded on {self.device}")
        except Exception as e:
            logger.warning(f"Could not load sentiment model: {e}. Using fallback.")
            self._loaded = False

    def preprocess_text(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'http\S+|www\S+', '', text)
        text = re.sub(r'@\w+|#\w+', '', text)
        text = re.sub(r'[^\w\sа-яё]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def detect_sarcasm_triggers(self, text: str) -> float:
        text_lower = text.lower()
        trigger_count = 0
        for pattern in self.sarcasm_patterns:
            matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
            trigger_count += matches
        max_expected = 3
        return min(trigger_count / max_expected, 1.0)

    def _fallback_sentiment(self, text: str) -> Dict[str, float]:
        negative_words = ['плохо', 'устал', 'не могу', 'трудно', 'стресс', 'депрессия',
                          'тяжело', 'ужасно', 'ненавижу', 'боюсь', 'тревога', 'одиноко',
                          'печально', 'достало', 'выжимает', 'зашкаливает', 'паника',
                          'провал', 'не готов', 'не выучил', 'не могу сосредоточиться',
                          'не могу уснуть', 'не хочу', 'больно', 'тоскливо', 'завалил',
                          'кошмар', 'мучаюсь', 'надоело', 'страдаю', 'плачу', 'страшно',
                          'bad', 'tired', 'stress', 'depressed', 'exhausted', 'overwhelmed']
        positive_words = ['хорошо', 'отлично', 'рад', 'счастлив', 'люблю', 'круто',
                          'прекрасно', 'замечательно', 'нравится', 'весело', 'гордость',
                          'пятёрка', 'пятерка', 'сдал', 'разобрался', 'справился',
                          'получил стипендию', 'лучше', 'молодец', 'закончил',
                          'good', 'great', 'happy', 'love', 'awesome', 'wonderful']

        text_lower = text.lower()
        neg_count = sum(1 for w in negative_words if w in text_lower)
        pos_count = sum(1 for w in positive_words if w in text_lower)
        total = neg_count + pos_count

        if total == 0:
            return {"positive": 0.33, "neutral": 0.34, "negative": 0.33}

        pos_ratio = pos_count / total * 0.75
        neg_ratio = neg_count / total * 0.75
        neutral_ratio = 1 - pos_ratio - neg_ratio
        return {"positive": pos_ratio, "neutral": neutral_ratio, "negative": neg_ratio}

    def analyze_sentiment(self, texts: List[str]) -> List[Dict[str, float]]:
        results = []
        for text in texts:
            if not text or len(text.strip()) < 3:
                results.append({"positive": 0.33, "neutral": 0.34, "negative": 0.33})
                continue
            results.append(self._fallback_sentiment(text))
        return results

    def aggregate_sentiment(self, sentiments: List[Dict[str, float]]) -> float:
        if not sentiments:
            return 0.0
        avg_positive = np.mean([s["positive"] for s in sentiments])
        avg_negative = np.mean([s["negative"] for s in sentiments])
        sentiment_score = (avg_negative * 1.0 + avg_positive * (-1.0))
        return float(np.clip(sentiment_score, -1, 1))


sentiment_analyzer = SentimentAnalyzer()
