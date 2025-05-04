"""
User management endpoints for the Face Recognition API.
"""
import os
import time
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Path, HTTPException
from fastapi.responses import JSONResponse, FileResponse

import config
from services.database_service import get_all_users, get_user_by_id
from middleware import response_cache

router = APIRouter()

# Simple in-memory cache for users list
_users_cache = {
    "data": None,
    "timestamp": 0
}

@router.get("/api/users", tags=["Users"])
async def get_users():
    """
    Get all registered users.

    Returns:
        List of registered users
    """
    try:
        # Use simple time-based caching (10 seconds)
        current_time = time.time()
        if _users_cache["data"] and current_time - _users_cache["timestamp"] < 10:
            # Return cached data if it's fresh
            return _users_cache["data"]
        
        # Fetch users from database
        users = await get_all_users()
        
        # Clean large data fields from response
        for user in users:
            if "face_encoding" in user:
                del user["face_encoding"]
            if "multi_angle_encodings" in user:
                del user["multi_angle_encodings"]
        
        # Prepare response
        result = {
            "status": "success",
            "message": f"Retrieved {len(users)} users",
            "users": users
        }
        
        # Update cache
        _users_cache["data"] = result
        _users_cache["timestamp"] = current_time
        
        return result
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return {
            "status": "error",
            "message": "Failed to retrieve users",
            "users": []
        }

@router.get("/api/users/{user_id}", tags=["Users"])
async def get_user_by_id(user_id: str = Path(..., description="The ID of the user to retrieve")):
    """
    Get a specific user by ID.

    Args:
        user_id: The ID of the user to retrieve

    Returns:
        User details or error if not found
    """
    try:
        print(f"Looking for user with ID: {user_id}")

        # Check cache first
        cache_key = f"user_{user_id}"
        if cache_key in response_cache and datetime.now() < response_cache[cache_key]["expiry"]:
            return response_cache[cache_key]["data"]

        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

        # Don't send face encoding data
        if "face_encoding" in user:
            del user["face_encoding"]
        if "multi_angle_encodings" in user:
            del user["multi_angle_encodings"]

        result = {
            "status": "success",
            "message": "User found",
            "user": user
        }

        # Cache the result
        response_cache[cache_key] = {
            "data": result,
            "expiry": datetime.now() + timedelta(seconds=config.CACHE_EXPIRY)
        }

        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user {user_id}: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to retrieve user with ID {user_id}",
            "user": None
        }

@router.get("/api/users/{user_id}/image", tags=["Users"])
async def get_user_image(user_id: str = Path(..., description="The ID of the user")):
    """
    Get a user's image.

    Args:
        user_id: The ID of the user

    Returns:
        User's image file
    """
    try:
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

        image_path = user.get("image_path", "")
        if not image_path or not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail="Image not found")

        return FileResponse(image_path)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user image {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# For backward compatibility
@router.get("/users", tags=["Legacy"])
async def get_users_legacy():
    """Legacy endpoint for getting all users"""
    return await get_users()

@router.get("/users/{user_id}", tags=["Legacy"])
async def get_user_by_id_legacy(user_id: str):
    """Legacy endpoint for getting user by ID"""
    return await get_user_by_id(user_id)
