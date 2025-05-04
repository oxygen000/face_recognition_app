"""
Health check endpoints for the Face Recognition API.
"""
from fastapi import APIRouter

import config
from middleware import metrics

router = APIRouter()

@router.get("/api/health", tags=["Health"])
async def api_health_check():
    """
    API health check endpoint.

    Returns:
        Health status of the API
    """
    return {
        "status": "healthy",
        "version": config.API_VERSION,
        "metrics": metrics.get_metrics()
    }

@router.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint (legacy).

    Returns:
        Health status of the API
    """
    return await api_health_check()

@router.get("/", tags=["Root"])
async def root():
    """
    Root endpoint.

    Returns:
        Welcome message
    """
    return {"message": "Face Recognition API is running", "version": config.API_VERSION}
