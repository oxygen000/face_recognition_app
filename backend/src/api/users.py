"""
User management endpoints for the Face Recognition API.
"""

import uuid
import time
from fastapi import APIRouter, HTTPException, Path, Query, Response
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path as FilePath
import os

# Import services and utilities
sys.path.append(str(FilePath(__file__).resolve().parent.parent))
from utils.database import database
from utils.logger import get_logger
from config import config

# Get logger
logger = get_logger("api.users")

# Create router
router = APIRouter(tags=["Users"])

@router.get("/api/users")
async def get_users(page: int = Query(1, description="Page number"), limit: int = Query(100, description="Items per page")):
    """
    Get all registered users with pagination and caching.
    
    Args:
        page: Page number (starting from 1)
        limit: Number of items per page
    
    Returns:
        List of registered users
    """
    cache_key = f"users_page_{page}_limit_{limit}"
    
    try:
        # Try to get data from cache first
        cache_data = await database.get_cache(cache_key)
        if cache_data:
            logger.info(f"Retrieved users from cache (page {page}, limit {limit})")
            return cache_data
            
        logger.info(f"Getting users (page {page}, limit {limit})")
        users = await database.get_users_paginated(page, limit)
        
        # Clean face_encoding from response
        for user in users:
            if "face_encoding" in user:
                del user["face_encoding"]
            if "multi_angle_encodings" in user:
                del user["multi_angle_encodings"]
        
        # Get total count for pagination info
        total_count = await database.get_users_count()
        
        response = {
            "status": "success",
            "message": f"Retrieved {len(users)} users",
            "users": users,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit
            }
        }
        
        # Cache the response for 5 minutes
        await database.set_cache(cache_key, response, 300)
        
        return response
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to retrieve users: {str(e)}"}
        )

@router.get("/api/users/{user_id}")
async def get_user_by_id(user_id: str = Path(..., description="The ID of the user to retrieve")):
    """
    Get a specific user by ID.
    
    Args:
        user_id: The ID of the user to retrieve
    
    Returns:
        User details or error if not found
    """
    try:
        logger.info(f"Getting user with ID: {user_id}")
        
        user = await database.get_user_by_id(user_id)
        if not user:
            logger.warning(f"User with ID {user_id} not found")
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": f"User with ID {user_id} not found"}
            )
        
        # Don't send face encoding data
        if "face_encoding" in user:
            del user["face_encoding"]
        if "multi_angle_encodings" in user:
            del user["multi_angle_encodings"]
        
        return {
            "status": "success",
            "message": "User found",
            "user": user
        }
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to retrieve user: {str(e)}"}
        )

@router.get("/api/users/{user_id}/image")
async def get_user_image(user_id: str = Path(..., description="The ID of the user")):
    """
    Get a user's image by user ID.
    
    Args:
        user_id: The ID of the user
    
    Returns:
        The user's image file or error if not found
    """
    try:
        logger.info(f"Getting image for user with ID: {user_id}")
        
        user = await database.get_user_by_id(user_id)
        if not user:
            logger.warning(f"User with ID {user_id} not found")
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": f"User with ID {user_id} not found"}
            )
        
        # Check if user has an image path
        if user.get("image_path"):
            image_path = user["image_path"]
            
            # Handle relative paths
            if not os.path.isabs(image_path):
                image_path = os.path.join(config.BASE_DIR, image_path)
            
            if os.path.exists(image_path):
                return FileResponse(image_path)
        
        # Check uploads directory for user image
        uploads_path = os.path.join(config.UPLOADS_DIR, f"{user_id}.jpg")
        if os.path.exists(uploads_path):
            return FileResponse(uploads_path)
        
        # No image found
        logger.warning(f"No image found for user with ID {user_id}")
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": f"No image found for user with ID {user_id}"}
        )
    except Exception as e:
        logger.error(f"Error getting user image: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to retrieve user image: {str(e)}"}
        )

@router.delete("/api/users/{user_id}")
async def delete_user(user_id: str = Path(..., description="The ID of the user to delete")):
    """
    Delete a user by ID.
    
    Args:
        user_id: The ID of the user to delete
    
    Returns:
        Success message or error if not found
    """
    try:
        logger.info(f"Deleting user with ID: {user_id}")
        
        # Check if user exists
        user = await database.get_user_by_id(user_id)
        if not user:
            logger.warning(f"User with ID {user_id} not found")
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": f"User with ID {user_id} not found"}
            )
        
        # Delete user
        deleted = await database.delete_user(user_id)
        
        if deleted:
            # Try to delete user image if it exists
            try:
                uploads_path = os.path.join(config.UPLOADS_DIR, f"{user_id}.jpg")
                if os.path.exists(uploads_path):
                    os.remove(uploads_path)
                    logger.info(f"Deleted image for user with ID {user_id}")
            except Exception as e:
                logger.warning(f"Failed to delete image for user with ID {user_id}: {e}")
            
            return {
                "status": "success",
                "message": f"User with ID {user_id} deleted successfully"
            }
        else:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Failed to delete user with ID {user_id}"}
            )
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to delete user: {str(e)}"}
        )

@router.get("/api/users/search")
async def search_users(query: str = Query(..., description="Search query")):
    """
    Search for users by name, employee ID, department, or role.
    
    Args:
        query: The search query
    
    Returns:
        List of matching users
    """
    try:
        logger.info(f"Searching for users with query: {query}")
        
        users = await database.search_users(query)
        
        # Clean face_encoding from response
        for user in users:
            if "face_encoding" in user:
                del user["face_encoding"]
            if "multi_angle_encodings" in user:
                del user["multi_angle_encodings"]
        
        return {
            "status": "success",
            "message": f"Found {len(users)} users matching '{query}'",
            "users": users
        }
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to search users: {str(e)}"}
        )

# Legacy endpoints for backward compatibility
@router.get("/users")
async def get_users_legacy():
    """Legacy endpoint for getting all users"""
    return await get_users()

@router.get("/users/{user_id}")
async def get_user_by_id_legacy(user_id: str = Path(..., description="The ID of the user to retrieve")):
    """Legacy endpoint for getting user by ID"""
    return await get_user_by_id(user_id)
