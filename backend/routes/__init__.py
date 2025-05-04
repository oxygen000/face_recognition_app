"""
API routes for the Face Recognition API.
"""
from fastapi import APIRouter

from .health import router as health_router
from .users import router as users_router
from .recognition import router as recognition_router
from .admin import router as admin_router

# Create a main router that includes all route modules
router = APIRouter()

# Include all route modules
router.include_router(health_router)
router.include_router(users_router)
router.include_router(recognition_router)
router.include_router(admin_router)
