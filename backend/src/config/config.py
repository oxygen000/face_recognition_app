"""
Configuration module for the Face Recognition API.
Contains all configuration settings for the application.
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Database settings
DB_PATH = os.environ.get("DB_PATH", str(BASE_DIR / "data" / "face_recognition.db"))

# API settings
API_HOST = os.environ.get("API_HOST", "0.0.0.0")
API_PORT = int(os.environ.get("API_PORT", "8000"))
API_DEBUG = os.environ.get("API_DEBUG", "False").lower() == "true"
API_TITLE = "Face Recognition API"
API_DESCRIPTION = "API for face recognition and management"
API_VERSION = "1.0.0"

# Face recognition settings
FACE_RECOGNITION_TOLERANCE = float(os.environ.get("FACE_RECOGNITION_TOLERANCE", "0.6"))
FACE_RECOGNITION_MODEL = os.environ.get("FACE_RECOGNITION_MODEL", "hog")  # 'hog' or 'cnn'
MULTI_ANGLE_JITTER = int(os.environ.get("MULTI_ANGLE_JITTER", "10"))
MAX_CONCURRENT_RECOGNITIONS = int(os.environ.get("MAX_CONCURRENT_RECOGNITIONS", "5"))

# File storage settings
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Logging settings
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_FILE = os.environ.get("LOG_FILE", str(BASE_DIR / "logs" / "app.log"))

# Create logs directory if it doesn't exist
log_dir = Path(LOG_FILE).parent
log_dir.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT,
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

# CORS settings
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# Cache settings
CACHE_ENABLED = os.environ.get("CACHE_ENABLED", "True").lower() == "true"
CACHE_TTL = int(os.environ.get("CACHE_TTL", "3600"))  # 1 hour

# Security settings
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION = int(os.environ.get("JWT_EXPIRATION", "86400"))  # 24 hours

# Get all config as a dictionary
def get_all_config() -> Dict[str, Any]:
    """
    Returns all configuration settings as a dictionary.
    Excludes sensitive information like JWT_SECRET.
    """
    return {
        "api": {
            "host": API_HOST,
            "port": API_PORT,
            "debug": API_DEBUG,
            "title": API_TITLE,
            "description": API_DESCRIPTION,
            "version": API_VERSION,
        },
        "face_recognition": {
            "tolerance": FACE_RECOGNITION_TOLERANCE,
            "model": FACE_RECOGNITION_MODEL,
            "multi_angle_jitter": MULTI_ANGLE_JITTER,
            "max_concurrent_recognitions": MAX_CONCURRENT_RECOGNITIONS,
        },
        "storage": {
            "uploads_dir": str(UPLOADS_DIR),
            "db_path": DB_PATH,
        },
        "logging": {
            "level": LOG_LEVEL,
            "file": LOG_FILE,
        },
        "cors": {
            "origins": CORS_ORIGINS,
        },
        "cache": {
            "enabled": CACHE_ENABLED,
            "ttl": CACHE_TTL,
        },
    }
