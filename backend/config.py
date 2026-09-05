import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_DIR = os.path.join(BASE_DIR, 'database')
os.makedirs(DATABASE_DIR, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'border-ai-defense-command-center-secret-key-2026-super-secure-production-ready')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'border-ai-jwt-secret-key-2026-super-secure-hmac-sha256-production-token-string')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    raw_db_url = os.environ.get('DATABASE_URL')
    if raw_db_url and raw_db_url.startswith('postgres://'):
        raw_db_url = raw_db_url.replace('postgres://', 'postgresql://', 1)

    SQLALCHEMY_DATABASE_URI = raw_db_url or f'sqlite:///{os.path.join(DATABASE_DIR, "borderai.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')

    # AI Detection Thresholds Defaults
    DEFAULT_CONFIDENCE_THRESHOLD = 75.0
    AUTO_ALERT_THRESHOLD = 80.0
