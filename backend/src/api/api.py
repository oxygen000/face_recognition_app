"""
Main API module for the Face Recognition API.
Includes all API routes and middleware.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import sys
from pathlib import Path
import time

# Import config and logger
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import config
from utils.logger import get_logger

# Import middleware
from middleware.metrics_middleware import MetricsMiddleware
from middleware.cors_middleware import setup_cors

# Import API routes
from api.health import router as health_router
from api.users import router as users_router
from api.recognition import router as recognition_router
from api.registration import router as registration_router

# Get logger
logger = get_logger("api")

# Create FastAPI app
app = FastAPI(
    title=config.API_TITLE,
    description=config.API_DESCRIPTION,
    version=config.API_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add middleware
app.add_middleware(MetricsMiddleware)
setup_cors(app)

# Add exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for the API.
    
    Args:
        request: The request object
        exc: The exception
        
    Returns:
        A JSON response with the error message
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": f"Internal server error: {str(exc)}"}
    )

# Add API routes
app.include_router(health_router)
app.include_router(users_router)
app.include_router(recognition_router)
app.include_router(registration_router)

# Mount static files
app.mount("/uploads", StaticFiles(directory=str(config.UPLOADS_DIR)), name="uploads")

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint.
    
    Returns:
        Welcome message
    """
    return {"message": "Face Recognition API is running", "version": config.API_VERSION}
