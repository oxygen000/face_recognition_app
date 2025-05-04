"""
Health check endpoints for the Face Recognition API.
"""

from fastapi import APIRouter
import sys
from pathlib import Path

# Import services
sys.path.append(str(Path(__file__).resolve().parent.parent))
from services.metrics_service import metrics_service
from config import config
from utils.logger import get_logger

# Get logger
logger = get_logger("api.health")

# Create router
router = APIRouter(tags=["Health"])

@router.get("/healthz")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status of the API
    """
    logger.debug("Health check requested")
    return {
        "status": "healthy",
        "version": config.API_VERSION,
        "metrics": metrics_service.get_metrics()
    }

@router.get("/health")
async def health_check_legacy():
    """
    Health check endpoint (legacy).
    
    Returns:
        Health status of the API
    """
    logger.debug("Legacy health check requested")
    return await health_check()
