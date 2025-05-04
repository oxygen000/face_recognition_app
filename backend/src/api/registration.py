"""
User registration endpoints for the Face Recognition API.
"""

import uuid
import json
import os
import base64
from fastapi import APIRouter, HTTPException, File, UploadFile, Body, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path
import time

# Import services and utilities
sys.path.append(str(Path(__file__).resolve().parent.parent))
from services.face_service import face_service
from utils.database import database
from utils.logger import get_logger
from config import config

# Get logger
logger = get_logger("api.registration")

# Create router
router = APIRouter(tags=["Registration"])

async def process_face_encoding(user_id: str, file_path: str):
    """
    Process face encoding in background
    """
    try:
        logger.info(f"Processing face encoding for user {user_id} from {file_path}")
        # Offload CPU-intensive operation to thread pool
        face_encoding = await run_in_threadpool(
            lambda: face_service.process_image_file(file_path)
        )
        
        if face_encoding is not None:
            # Detect faces
            face_locations = face_service.detect_faces(face_encoding)
            
            if face_locations:
                # Get first face location
                face_location = face_locations[0]
                
                # Generate face encoding
                face_encoding_vector = face_service.encode_face(face_encoding, face_location)
                
                if face_encoding_vector is not None:
                    # Convert to bytes
                    face_encoding_bytes = face_service.encode_to_bytes(face_encoding_vector)
                    
                    # Generate multi-angle encodings
                    multi_encodings = face_service.generate_multi_angle_encodings(face_encoding, face_location)
                    multi_encodings_bytes = face_service.encode_multiple_to_bytes(multi_encodings) if multi_encodings else None
                    
                    # Analyze face
                    face_analysis = face_service.analyze_face(face_encoding, face_location)
                    face_analysis_json = json.dumps(face_analysis) if face_analysis else None
                    
                    # Update in database
                    await database.update_user(
                        user_id, 
                        {"face_analysis": face_analysis_json},
                        face_encoding_bytes,
                        multi_encodings_bytes
                    )
                    
                    logger.info(f"✅ Updated face encoding for user {user_id}")
                    return True
            
            logger.warning(f"⚠️ No faces detected in image for user {user_id}")
            return False
        else:
            logger.warning(f"⚠️ Failed to process image for user {user_id}")
            return False
    except Exception as e:
        logger.error(f"❌ Error processing face encoding for user {user_id}: {e}")
        return False

@router.post("/api/register")
async def register_face(
    background_tasks: BackgroundTasks,
    name: str = Body(...),
    image_base64: str = Body(...),
    employee_id: Optional[str] = Body(None),
    department: Optional[str] = Body(None),
    role: Optional[str] = Body(None),
    bypass_angle_check: Optional[bool] = Body(False),
    train_multiple: Optional[bool] = Body(True)
):
    """
    Register a face from a base64 encoded image.
    
    Args:
        name: User's name
        image_base64: Base64 encoded image
        employee_id: Optional employee ID
        department: Optional department
        role: Optional role
        bypass_angle_check: Whether to bypass face angle check
        train_multiple: Whether to generate multi-angle encodings for better recognition
    
    Returns:
        Registration result with user data
    """
    # Validate input
    if not name or not name.strip():
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Name is required"}
        )
    
    if not image_base64:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Image is required"}
        )
    
    try:
        # Process the image using thread pool
        image_array = await run_in_threadpool(
            lambda: face_service.process_image(image_base64)
        )
        
        if image_array is None:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Invalid image data"}
            )
        
        # Detect faces using thread pool
        face_locations = await run_in_threadpool(
            lambda: face_service.detect_faces(image_array)
        )
        
        if not face_locations:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "No face detected in the image. Please ensure the face is clearly visible."}
            )
        
        # Get first face location
        face_location = face_locations[0]
        
        # Analyze face to get pose and feature information
        face_analysis = await run_in_threadpool(
            lambda: face_service.analyze_face(image_array, face_location)
        )
        
        # Check face angle if not bypassed
        if not bypass_angle_check and face_analysis and "pose" in face_analysis:
            pose = face_analysis["pose"]
            yaw = abs(pose.get("yaw", 0))
            pitch = abs(pose.get("pitch", 0))
            roll = abs(pose.get("roll", 0))
            
            if yaw > 15 or pitch > 15 or roll > 15:
                return JSONResponse(
                    status_code=400,
                    content={
                        "status": "error",
                        "message": "Face angle is not optimal for registration. Please look directly at the camera.",
                        "face_analysis": face_analysis,
                        "pose_recommendation": face_analysis.get("pose_recommendation")
                    }
                )
        
        # Generate face encoding in a separate thread
        face_encoding = await run_in_threadpool(
            lambda: face_service.encode_face(image_array, face_location)
        )
        
        if face_encoding is None:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Failed to generate face encoding. Please try a different image."}
            )
        
        # Generate multi-angle encodings if requested
        multi_encodings = None
        if train_multiple:
            multi_encodings = await run_in_threadpool(
                lambda: face_service.generate_multi_angle_encodings(image_array, face_location)
            )
        
        # Convert encodings to bytes for storage
        face_encoding_bytes = face_service.encode_to_bytes(face_encoding)
        multi_encodings_bytes = face_service.encode_multiple_to_bytes(multi_encodings) if multi_encodings else None
        
        # Generate user ID and face ID
        user_id = str(uuid.uuid4())
        face_id = str(uuid.uuid4())
        
        # Save image to file
        try:
            # Create uploads directory if it doesn't exist
            os.makedirs(config.UPLOADS_DIR, exist_ok=True)
            
            # Save image to file
            image_path = os.path.join(config.UPLOADS_DIR, f"{user_id}.jpg")
            
            # If image_base64 is a data URI, extract the base64 part
            if image_base64.startswith('data:image'):
                image_base64 = image_base64.split(',')[1]
            
            # Decode base64 and save to file
            with open(image_path, "wb") as f:
                f.write(base64.b64decode(image_base64))
            
            logger.info(f"Saved image for user {user_id} to {image_path}")
        except Exception as e:
            logger.error(f"Error saving image: {e}")
            image_path = None
        
        # Prepare user data
        user_data = {
            "id": user_id,
            "face_id": face_id,
            "name": name,
            "employee_id": employee_id,
            "department": department,
            "role": role,
            "image_path": f"uploads/{user_id}.jpg" if image_path else None,
            "face_analysis": json.dumps(face_analysis) if face_analysis else None,
            "created_at": time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Add user to database
        await database.add_user(user_data, face_encoding_bytes, multi_encodings_bytes)
        
        # Return success response
        return {
            "status": "success",
            "message": f"User {name} registered successfully",
            "user_id": user_id,
            "face_id": face_id,
            "user": {
                "id": user_id,
                "face_id": face_id,
                "name": name,
                "employee_id": employee_id,
                "department": department,
                "role": role,
                "image_path": f"uploads/{user_id}.jpg" if image_path else None,
                "created_at": user_data["created_at"]
            },
            "face_analysis": face_analysis
        }
    except Exception as e:
        logger.error(f"Error registering face: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Error registering face: {str(e)}"}
        )
