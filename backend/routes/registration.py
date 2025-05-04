"""
Face registration endpoints for the Face Recognition API.
"""
import os
import uuid
import base64
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool

import config
from services.database_service import add_user, get_user_by_id
from services.face_recognition_service import FaceRecognitionService

router = APIRouter()

# Face recognition service
face_service = FaceRecognitionService()

async def process_face_encoding(user_id: str, file_path: str):
    """
    Process face encoding in background
    """
    try:
        print(f"Processing face encoding for user {user_id} from {file_path}")
        # Offload CPU-intensive operation to thread pool
        face_encoding = await run_in_threadpool(
            lambda: face_service.process_image_file(file_path)
        )

        if face_encoding is not None:
            # Convert to bytes
            face_encoding_bytes = face_service.encode_to_bytes(face_encoding)
            # Update in database
            from services.database_service import update_face_encoding
            await update_face_encoding(user_id, face_encoding_bytes)
            print(f"✅ Updated face encoding for user {user_id}")
            return True
        else:
            print(f"⚠️ Failed to generate face encoding for user {user_id}")
            return False
    except Exception as e:
        print(f"❌ Error processing face encoding for user {user_id}: {e}")
        return False

@router.post("/api/register", tags=["Registration"])
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
        raise HTTPException(status_code=400, detail="Name is required")

    if not image_base64:
        raise HTTPException(status_code=400, detail="Image is required")

    try:
        # Process the image using thread pool
        image_array = await run_in_threadpool(
            lambda: face_service.process_image(image_base64)
        )

        if image_array is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Detect faces using thread pool
        face_locations = await run_in_threadpool(
            lambda: face_service.detect_faces(image_array)
        )

        if not face_locations:
            raise HTTPException(
                status_code=400,
                detail="No faces detected in the image. Please ensure the face is clearly visible."
            )

        if len(face_locations) > 1:
            raise HTTPException(
                status_code=400,
                detail="Multiple faces detected in the image. Please use an image with only one face."
            )

        # Analyze face to get pose and feature information
        face_analysis = await run_in_threadpool(
            lambda: face_service.analyze_face(image_array, face_locations[0])
        )

        # Check if the face pose is acceptable for registration
        if face_analysis and "pose" in face_analysis:
            pose = face_analysis["pose"]
            # Relax the pose requirements significantly to allow more faces to be registered
            if abs(pose.get("yaw", 0)) > 60 or abs(pose.get("pitch", 0)) > 45 or abs(pose.get("roll", 0)) > 30:
                # Check if we should still allow registration despite poor pose
                if bypass_angle_check:
                    print(f"Bypassing face angle check for {name} registration")
                else:
                    return JSONResponse(
                        status_code=400,
                        content={
                            "status": "error",
                            "message": "Face angle is not optimal for registration. Please face the camera directly.",
                            "pose_recommendation": face_analysis.get("pose_recommendation"),
                            "face_analysis": face_analysis
                        }
                    )

        # Generate face encodings based on train_multiple parameter
        multi_encodings = None
        face_encoding = None

        if train_multiple:
            # Generate multi-angle face encodings for better recognition with various angles
            multi_encodings = await run_in_threadpool(
                lambda: face_service.encode_face_multi_angle(image_array, face_locations[0])
            )

            if multi_encodings and len(multi_encodings) > 0:
                # Use the first encoding from multi-angle set
                face_encoding = multi_encodings[0]
                print(f"Generated {len(multi_encodings)} multi-angle encodings for {name}")
            else:
                # Fall back to standard encoding if multi-angle fails
                face_encoding = await run_in_threadpool(
                    lambda: face_service.encode_face(image_array, face_locations[0])
                )
                print(f"Multi-angle encoding failed, using single encoding for {name}")
        else:
            # Just use standard encoding
            face_encoding = await run_in_threadpool(
                lambda: face_service.encode_face(image_array, face_locations[0])
            )
            print(f"Using single encoding for {name} (multi-angle disabled)")

        if face_encoding is None:
            raise HTTPException(
                status_code=400,
                detail="Could not generate face encoding. Please try a different image."
            )

        # Save the base64 image to a file in uploads directory
        image_data = image_base64
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]

        # Generate file paths and names
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        face_id = f"face-{uuid.uuid4()}"
        filename = f"{timestamp}_{face_id}.jpg"
        image_path = os.path.join("uploads", filename)

        # Save the image file
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        with open(image_path, "wb") as f:
            f.write(base64.b64decode(image_data))

        # Prepare user data
        user_data = {
            "name": name,
            "employee_id": employee_id or "",
            "department": department or "",
            "role": role or "",
            "face_id": face_id,
            "image_path": image_path,
            "image_url": f"/uploads/{filename}",
            "created_at": datetime.now().isoformat(),
            "face_analysis": json.dumps(face_analysis) if face_analysis else ""
        }

        # Convert face encoding to bytes for storage
        face_encoding_bytes = face_service.encode_to_bytes(face_encoding)

        # Convert multi-angle encodings to bytes if available
        multi_encodings_bytes = None
        if multi_encodings and len(multi_encodings) > 0 and train_multiple:
            multi_encodings_bytes = face_service.encode_multiple_to_bytes(multi_encodings)
            print(f"Storing {len(multi_encodings)} multi-angle encodings for {name}")

        # Add user to database with face encoding and multi-angle encodings if available
        user_id = await add_user(user_data, face_encoding_bytes, multi_encodings_bytes)

        # Get the user from database
        user = await get_user_by_id(user_id)

        # Remove face encoding from response
        if user and "face_encoding" in user:
            del user["face_encoding"]
        if user and "multi_angle_encodings" in user:
            del user["multi_angle_encodings"]

        # Return success response
        return {
            "status": "success",
            "message": f"Successfully registered {name} in the system!",
            "user": user,
            "face_analysis": face_analysis,
            "multi_angle_trained": multi_encodings is not None and len(multi_encodings) > 1 if multi_encodings else False
        }

    except Exception as e:
        print(f"Error during registration: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during registration: {str(e)}"
        )

@router.post("/register", tags=["Legacy"])
async def register_face_legacy(
    background_tasks: BackgroundTasks,
    name: str = Body(...),
    image_base64: str = Body(...)
):
    """Legacy endpoint for face registration"""
    return await register_face(background_tasks, name, image_base64)

@router.post("/api/register_with_file", tags=["Registration"])
async def register_with_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    employee_id: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    train_multiple: Optional[str] = Form("false"),
    bypass_angle_check: Optional[str] = Form("false")
):
    """
    Register a face from a file upload.

    Args:
        file: Image file
        name: User's name
        employee_id: Optional employee ID
        department: Optional department
        role: Optional role
        train_multiple: Whether to train with multiple angles
        bypass_angle_check: Whether to bypass face angle check

    Returns:
        Registration result with user data
    """
    # Validate input
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    if not file:
        raise HTTPException(status_code=400, detail="Image file is required")

    # Convert string form values to boolean
    try:
        train_multiple_bool = train_multiple.lower() in ["true", "1", "yes", "y"]
    except AttributeError:
        # Handle the case when train_multiple is not a string
        train_multiple_bool = bool(train_multiple)

    try:
        bypass_angle_check_bool = bypass_angle_check.lower() in ["true", "1", "yes", "y"]
    except AttributeError:
        # Handle the case when bypass_angle_check is not a string
        bypass_angle_check_bool = bool(bypass_angle_check)

    print(f"Registration parameters: name='{name}', bypass_angle_check={bypass_angle_check} (parsed as {bypass_angle_check_bool})")

    try:
        # Check file type
        content_type = file.content_type or ""
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are accepted")

        # Read file content
        file_content = await file.read()
        content_length = len(file_content)
        print(f"Processing file upload: {file.filename}, size: {content_length} bytes, content-type: {content_type}")

        # Validate file size
        if content_length == 0:
            raise HTTPException(status_code=400, detail="Empty file submitted")

        # Add basic image validation - file must start with image signatures
        is_valid_image = False
        image_signatures = [
            b'\xff\xd8\xff',  # JPEG
            b'\x89\x50\x4e\x47',  # PNG
            b'GIF',  # GIF
            b'BM',  # BMP
            b'\x49\x49\x2a\x00',  # TIFF
            b'\x4d\x4d\x00\x2a',  # TIFF
        ]

        for sig in image_signatures:
            if file_content.startswith(sig):
                is_valid_image = True
                break

        if not is_valid_image:
            print(f"Invalid image format detected for file: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail="Invalid image format. Please upload a valid image file."
            )

        # Process the image in a thread pool
        try:
            image_array = await run_in_threadpool(
                lambda: face_service.process_image(file_content)
            )
        except Exception as img_error:
            print(f"Error processing image: {img_error}")
            raise HTTPException(
                status_code=400,
                detail=f"Error processing image: {str(img_error)}"
            )

        if image_array is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Detect faces in a thread pool
        face_locations = await run_in_threadpool(
            lambda: face_service.detect_faces(image_array)
        )

        if not face_locations:
            raise HTTPException(
                status_code=400,
                detail="No faces detected in the image. Please ensure the face is clearly visible."
            )

        if len(face_locations) > 1:
            raise HTTPException(
                status_code=400,
                detail="Multiple faces detected in the image. Please use an image with only one face."
            )

        # Analyze face to get pose and feature information
        face_analysis = await run_in_threadpool(
            lambda: face_service.analyze_face(image_array, face_locations[0])
        )

        # Check if the face pose is acceptable for registration
        if face_analysis and "pose" in face_analysis:
            pose = face_analysis["pose"]
            # Relax the pose requirements significantly to allow more faces to be registered
            if abs(pose.get("yaw", 0)) > 60 or abs(pose.get("pitch", 0)) > 45 or abs(pose.get("roll", 0)) > 30:
                # Check if we should still allow registration despite poor pose
                if bypass_angle_check_bool:
                    print(f"Bypassing face angle check for {name} registration")
                else:
                    return JSONResponse(
                        status_code=400,
                        content={
                            "status": "error",
                            "message": "Face angle is not optimal for registration. Please face the camera directly.",
                            "pose_recommendation": face_analysis.get("pose_recommendation"),
                            "face_analysis": face_analysis
                        }
                    )

        # Generate multi-angle face encodings for better recognition with various angles
        multi_encodings = await run_in_threadpool(
            lambda: face_service.encode_face_multi_angle(image_array, face_locations[0])
        )

        if not multi_encodings:
            # Fall back to standard encoding if multi-angle fails
            face_encoding = await run_in_threadpool(
                lambda: face_service.encode_face(image_array, face_locations[0])
            )

            if face_encoding is None:
                raise HTTPException(
                    status_code=400,
                    detail="Could not generate face encoding. Please try a different image."
                )
        else:
            # Use the first encoding from multi-angle set
            face_encoding = multi_encodings[0]

        # Generate file paths and names
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        face_id = f"face-{uuid.uuid4()}"
        filename = f"{timestamp}_{face_id}.jpg"
        image_path = os.path.join("uploads", filename)

        # Save the image file
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        with open(image_path, "wb") as f:
            f.write(file_content)

        # Handle potential Unicode encoding issues
        try:
            safe_name = name.encode('ascii', 'replace').decode('ascii')
            safe_employee_id = employee_id.encode('ascii', 'replace').decode('ascii') if employee_id else ""
            safe_department = department.encode('ascii', 'replace').decode('ascii') if department else ""
            safe_role = role.encode('ascii', 'replace').decode('ascii') if role else ""

            # Use clean face analysis JSON
            face_analysis_json = ""
            if face_analysis:
                # Convert face analysis to JSON with ASCII encoding
                try:
                    face_analysis_json = json.dumps(face_analysis, ensure_ascii=True)
                except Exception as e:
                    print(f"Error serializing face analysis to JSON: {e}")
                    # Use a clean, minimal JSON if we can't serialize the full analysis
                    face_analysis_json = json.dumps({"status": "success"}, ensure_ascii=True)
        except Exception as e:
            print(f"Error during character encoding sanitization: {e}")
            # Fall back to basic ASCII
            safe_name = name.encode('ascii', 'ignore').decode('ascii')
            safe_employee_id = (employee_id or "").encode('ascii', 'ignore').decode('ascii')
            safe_department = (department or "").encode('ascii', 'ignore').decode('ascii')
            safe_role = (role or "").encode('ascii', 'ignore').decode('ascii')
            face_analysis_json = "{}"

        # Prepare user data with sanitized strings
        user_data = {
            "name": safe_name,
            "employee_id": safe_employee_id,
            "department": safe_department,
            "role": safe_role,
            "face_id": face_id,
            "image_path": image_path,
            "image_url": f"/uploads/{filename}",
            "created_at": datetime.now().isoformat(),
            "face_analysis": face_analysis_json
        }

        # Convert face encoding to bytes for storage
        face_encoding_bytes = face_service.encode_to_bytes(face_encoding)
        multi_encodings_bytes = None
        if multi_encodings and len(multi_encodings) > 1 and train_multiple_bool:
            multi_encodings_bytes = face_service.encode_multiple_to_bytes(multi_encodings)

        # Add user to database with face encoding
        try:
            user_id = await add_user(user_data, face_encoding_bytes, multi_encodings_bytes)
        except Exception as db_error:
            print(f"Database error during user registration: {db_error}")
            # Try a simpler version if DB insertion fails
            simplified_user_data = {
                "name": safe_name.replace("'", "").replace('"', ""),
                "employee_id": "",
                "department": "",
                "role": "",
                "face_id": face_id,
                "image_path": image_path,
                "image_url": f"/uploads/{filename}",
                "created_at": datetime.now().isoformat(),
                "face_analysis": ""
            }
            user_id = await add_user(simplified_user_data, face_encoding_bytes)

        # Get the user from database
        user = await get_user_by_id(user_id)

        # Remove face encoding from response
        if user and "face_encoding" in user:
            del user["face_encoding"]
        if user and "multi_angle_encodings" in user:
            del user["multi_angle_encodings"]

        # Return success response
        return {
            "status": "success",
            "message": f"Successfully registered {safe_name} in the system!",
            "user_id": user_id,
            "face_id": face_id,
            "user": user
        }

    except Exception as e:
        print(f"Error during file registration: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during registration: {str(e)}"
        )
