"""
Face recognition endpoints for the Face Recognition API.
"""

import json
import time
import asyncio
from fastapi import APIRouter, HTTPException, File, UploadFile, Body, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

# Import services and utilities
sys.path.append(str(Path(__file__).resolve().parent.parent))
from services.face_service import face_service
from utils.database import database
from utils.logger import get_logger
from config import config

# Get logger
logger = get_logger("api.recognition")

# Create router
router = APIRouter(tags=["Recognition"])

# Create semaphore to limit concurrent recognition operations
recognition_semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_RECOGNITIONS)

@router.post("/api/recognize")
async def recognize_face(
    request: Request,
    file: UploadFile = File(None),
    image_base64: str = Body(None)
):
    """
    Recognize a face from a provided image.
    
    Args:
        request: The request object
        file: Optional uploaded image file
        image_base64: Optional base64 encoded image
    
    Returns:
        Recognition result with matched user data or failure message
    """
    # Check if we have a file upload or base64 data
    image_data = None
    
    # Process file upload if available
    if file and file.filename:
        try:
            contents = await file.read()
            if contents:
                image_data = contents
                logger.info(f"Processing uploaded file: {file.filename}, size: {len(contents)} bytes")
        except Exception as e:
            logger.error(f"Error reading uploaded file: {e}")
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": f"Error reading uploaded file: {str(e)}"}
            )
    # Process base64 data if no file was uploaded
    elif image_base64:
        image_data = image_base64
    # Try to get data from form data if neither file nor base64 was provided
    else:
        form = await request.form()
        if "file" in form:
            file = form["file"]
            if hasattr(file, "read"):
                contents = await file.read()
                if contents:
                    image_data = contents
                    logger.info(f"Processing form file: {file.filename}, size: {len(contents)} bytes")
        elif "image_base64" in form:
            image_data = form["image_base64"]
    
    # Validate that we have image data
    if not image_data:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "No image provided. Please upload a file or provide base64 image data."}
        )
    
    # Use semaphore to limit concurrent face recognition operations
    async with recognition_semaphore:
        try:
            # Process the image in a thread pool to avoid blocking
            image_array = await run_in_threadpool(
                lambda: face_service.process_image(image_data)
            )
            
            if image_array is None:
                return JSONResponse(
                    status_code=400,
                    content={"status": "error", "message": "Invalid image data or format not supported"}
                )
            
            # Detect faces in a separate thread
            face_locations = await run_in_threadpool(
                lambda: face_service.detect_faces(image_array)
            )
            
            if not face_locations:
                return {
                    "status": "success",
                    "message": "No faces detected in the image. Please ensure the face is clearly visible.",
                    "recognized": False,
                    "diagnostic": {"face_detected": False}
                }
            
            # Get first face location
            face_location = face_locations[0]
            
            # Analyze face to get pose and feature information
            face_analysis = await run_in_threadpool(
                lambda: face_service.analyze_face(image_array, face_location)
            )
            
            # Generate face encoding in a separate thread
            face_encoding = await run_in_threadpool(
                lambda: face_service.encode_face(image_array, face_location)
            )
            
            if face_encoding is None:
                return {
                    "status": "success",
                    "message": "Found a face but couldn't generate encoding. Please try a different image.",
                    "recognized": False,
                    "diagnostic": {
                        "face_detected": True,
                        "encoding_generated": False,
                        "analysis": face_analysis
                    }
                }
            
            # Get all face encodings from database
            db_face_encodings = await database.get_all_face_encodings()
            
            if not db_face_encodings:
                return {
                    "status": "success",
                    "message": "No registered faces in the database to compare against.",
                    "recognized": False,
                    "diagnostic": {"registered_faces": 0}
                }
            
            # Find the closest match
            best_match = None
            lowest_distance = 1.0
            total_comparisons = 0
            used_poses = False
            
            for db_face in db_face_encodings:
                if db_face["face_encoding"]:
                    # Try to use multi-angle encodings if available
                    multi_encodings = None
                    if db_face.get("multi_angle_encodings"):
                        try:
                            multi_encodings = face_service.decode_multiple_from_bytes(db_face["multi_angle_encodings"])
                        except Exception as e:
                            logger.error(f"Error decoding multi-angle encodings: {e}")
                    
                    if multi_encodings:
                        # Compare against all multi-angle encodings and find the best match
                        for db_encoding in multi_encodings:
                            # Check if we have pose data for better matching
                            poses = None
                            if face_analysis and "pose" in face_analysis and db_face.get("face_analysis"):
                                try:
                                    db_face_analysis = json.loads(db_face["face_analysis"])
                                    if "pose" in db_face_analysis:
                                        poses = {
                                            "known": db_face_analysis["pose"],
                                            "unknown": face_analysis["pose"]
                                        }
                                        used_poses = True
                                except:
                                    poses = None
                            
                            # Run comparison in thread pool with pose information if available
                            if poses:
                                match_result, distance, adjusted_tolerance = await run_in_threadpool(
                                    lambda: face_service.compare_faces(db_encoding, face_encoding, poses=poses)
                                )
                            else:
                                match_result, distance, adjusted_tolerance = await run_in_threadpool(
                                    lambda: face_service.compare_faces(db_encoding, face_encoding)
                                )
                            
                            total_comparisons += 1
                            
                            if match_result and distance < lowest_distance:
                                lowest_distance = distance
                                best_match = {
                                    "user_id": db_face["id"],
                                    "face_id": db_face["face_id"],
                                    "name": db_face["name"],
                                    "image_path": db_face["image_path"] or db_face["image_url"],
                                    "confidence": 1.0 - distance,  # Convert distance to confidence
                                    "adjusted_tolerance": adjusted_tolerance,
                                    "multi_angle_match": True
                                }
                    else:
                        # Fall back to single encoding comparison
                        db_encoding = face_service.decode_from_bytes(db_face["face_encoding"])
                        
                        # Check if we have pose data for both faces for better matching
                        poses = None
                        if face_analysis and "pose" in face_analysis and db_face.get("face_analysis"):
                            try:
                                db_face_analysis = json.loads(db_face["face_analysis"])
                                if "pose" in db_face_analysis:
                                    poses = {
                                        "known": db_face_analysis["pose"],
                                        "unknown": face_analysis["pose"]
                                    }
                                    used_poses = True
                            except:
                                poses = None
                        
                        # Run comparison in thread pool with pose information if available
                        if poses:
                            match_result, distance, adjusted_tolerance = await run_in_threadpool(
                                lambda: face_service.compare_faces(db_encoding, face_encoding, poses=poses)
                            )
                        else:
                            match_result, distance, adjusted_tolerance = await run_in_threadpool(
                                lambda: face_service.compare_faces(db_encoding, face_encoding)
                            )
                        
                        total_comparisons += 1
                        
                        if match_result and distance < lowest_distance:
                            lowest_distance = distance
                            best_match = {
                                "user_id": db_face["id"],
                                "face_id": db_face["face_id"],
                                "name": db_face["name"],
                                "image_path": db_face["image_path"] or db_face["image_url"],
                                "confidence": 1.0 - distance,  # Convert distance to confidence
                                "adjusted_tolerance": adjusted_tolerance,
                                "multi_angle_match": False
                            }
            
            # If we have a match
            if best_match:
                # Get full user info
                user = await database.get_user_by_id(best_match["user_id"])
                if "face_encoding" in user:
                    del user["face_encoding"]
                if "multi_angle_encodings" in user:
                    del user["multi_angle_encodings"]
                
                confidence = best_match["confidence"]
                
                # Determine if this is a solid match or a possible match
                if confidence >= 0.7:  # More confident match
                    return {
                        "status": "success",
                        "message": f"Face recognized as {user['name']}!",
                        "recognized": True,
                        "user": user,
                        "confidence": confidence,
                        "diagnostic": {
                            "comparisons": total_comparisons,
                            "match_quality": "high" if confidence > 0.8 else "medium",
                            "used_pose_adjustment": used_poses,
                            "used_multi_angle": best_match.get("multi_angle_match", False),
                            "face_analysis": face_analysis
                        }
                    }
                else:  # Less confident match
                    return {
                        "status": "success",
                        "message": f"Possible match found: {user['name']}",
                        "recognized": True,
                        "possible_match": True,
                        "user": user,
                        "confidence": confidence,
                        "diagnostic": {
                            "comparisons": total_comparisons,
                            "match_quality": "low",
                            "used_pose_adjustment": used_poses,
                            "used_multi_angle": best_match.get("multi_angle_match", False),
                            "face_analysis": face_analysis,
                            "pose_recommendation": face_analysis.get("pose_recommendation") if face_analysis else None
                        }
                    }
            else:
                return {
                    "status": "success",
                    "message": "No matching face found in the database.",
                    "recognized": False,
                    "diagnostic": {
                        "face_detected": True,
                        "encoding_generated": True,
                        "comparisons": total_comparisons,
                        "face_analysis": face_analysis,
                        "pose_recommendation": face_analysis.get("pose_recommendation") if face_analysis else None
                    }
                }
        except Exception as e:
            logger.error(f"Error during face recognition: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Error processing recognition request: {str(e)}"
                }
            )

# Legacy endpoint for backward compatibility
@router.post("/recognize")
async def recognize_face_legacy(image_base64: str = Body(..., embed=True)):
    """Legacy endpoint for face recognition"""
    return await recognize_face(Request, image_base64=image_base64)
