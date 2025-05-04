"""
Face recognition service for the face recognition application.
This module handles face detection, encoding, and recognition.
"""
import os
import base64
import io
import tempfile
import numpy as np
import face_recognition
import threading
from PIL import Image, ImageOps, ImageEnhance
from functools import lru_cache
import time
import cv2
import math
from typing import List, Optional, Tuple, Dict, Any, Union

import config

# Global variables for performance tuning
USE_HOG_MODEL_FIRST = True  # Try faster HOG model first
MAX_IMAGE_SIZE = 1024  # Maximum image size for processing
FACE_LOCATIONS_CACHE_SIZE = 32
FACE_ENCODING_CACHE_SIZE = 32
FACE_COMPARISON_CACHE_SIZE = 128
JITTER_COUNT = 3  # Lower jitter count for better performance
FACE_RECOGNITION_LOCK = threading.Lock()  # Lock for face_recognition calls that might use GPU
MULTI_ANGLE_JITTER = 5  # More jitter for multi-angle encoding to capture variations
POSE_TOLERANCE_ADJUSTMENT = 0.1  # How much to adjust tolerance based on pose difference

class FaceRecognitionService:
    """Service for face recognition operations"""

    @staticmethod
    def process_image(image_data):
        """Process image data into a numpy array"""
        try:
            # Convert image to numpy array (handles both file paths and bytes)
            if isinstance(image_data, str):
                # Check if it's a base64 string
                if image_data.startswith("data:image") or len(image_data) > 500:
                    try:
                        # Handle base64 string
                        import base64
                        import io

                        # Extract the actual base64 content if it has a data URL prefix
                        if image_data.startswith("data:"):
                            image_data = image_data.split(',')[1]

                        # Decode base64 string
                        image_bytes = base64.b64decode(image_data)
                        img_stream = io.BytesIO(image_bytes)

                        # Open with PIL first
                        from PIL import Image
                        pil_img = Image.open(img_stream)

                        # Convert to RGB if needed
                        if pil_img.mode not in ('RGB', 'L'):
                            pil_img = pil_img.convert('RGB')

                        # Convert to numpy array
                        img = np.array(pil_img)
                        return img
                    except Exception as e:
                        print(f"Error processing base64 image: {e}")
                        return None
                else:
                    # It's a file path
                    img = face_recognition.load_image_file(image_data)
            else:
                # If it's bytes data
                import numpy as np
                from PIL import Image
                import io

                # Handle potential corrupt images
                try:
                    img_stream = io.BytesIO(image_data)
                    pil_img = Image.open(img_stream)

                    # Convert RGBA to RGB if needed to avoid alpha channel issues
                    if pil_img.mode == 'RGBA':
                        print("Converting RGBA image to RGB")
                        background = Image.new('RGB', pil_img.size, (255, 255, 255))
                        background.paste(pil_img, mask=pil_img.split()[3])  # 3 is the alpha channel
                        pil_img = background

                    # Convert grayscale to RGB
                    if pil_img.mode not in ('RGB', 'RGBA'):
                        print(f"Converting {pil_img.mode} image to RGB")
                        pil_img = pil_img.convert('RGB')

                    img = np.array(pil_img)
                except Exception as e:
                    print(f"Error processing image with PIL: {e}")
                    return None

            # Resize large images to improve performance and avoid memory issues
            if img is not None and (img.shape[0] > 1500 or img.shape[1] > 1500):
                print(f"Resizing large image of shape {img.shape}")
                from PIL import Image
                # Convert numpy array back to PIL Image
                pil_img = Image.fromarray(img)
                # Calculate new dimensions while preserving aspect ratio
                ratio = min(1500/img.shape[0], 1500/img.shape[1])
                new_size = (int(img.shape[1] * ratio), int(img.shape[0] * ratio))
                # Resize image
                pil_img = pil_img.resize(new_size, Image.LANCZOS)
                # Convert back to numpy array
                img = np.array(pil_img)
                print(f"Resized to {img.shape}")

            return img
        except Exception as e:
            print(f"Error processing image: {e}")
            return None

    @staticmethod
    def process_image_file(file_path):
        """Process an image file and return face encoding"""
        try:
            # Load the image
            image_array = FaceRecognitionService.process_image(file_path)
            if image_array is None:
                return None

            # Detect faces
            face_locations = FaceRecognitionService.detect_faces(image_array)
            if not face_locations:
                return None

            # Generate face encoding
            face_encoding = FaceRecognitionService.encode_face(image_array, face_locations[0])
            return face_encoding
        except Exception as e:
            print(f"Error processing image file: {e}")
            return None

    @staticmethod
    def enhance_image(image):
        """
        Enhance image for better face recognition with minimal processing
        for improved performance.
        """
        try:
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Auto-enhance contrast with minimal cutoff
            image = ImageOps.autocontrast(image, cutoff=2)

            # Minimal sharpness enhancement
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.2)

            # Improve brightness slightly to help with shadows
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(1.1)

            return image
        except Exception as e:
            print(f"Error enhancing image: {e}")
            return image  # Return original image if enhancement fails

    @staticmethod
    def detect_facial_landmarks(image_array, face_location=None):
        """
        Detect facial landmarks for a face.
        If face_location is not provided, detects the first face.
        Returns facial landmarks or None if no face detected.
        """
        try:
            # If no face location provided, detect faces first
            if not face_location:
                with FACE_RECOGNITION_LOCK:
                    face_locations = face_recognition.face_locations(image_array)
                if not face_locations:
                    print("No faces detected in image")
                    return None
                face_location = face_locations[0]  # Use the first face

            # Get facial landmarks
            with FACE_RECOGNITION_LOCK:
                landmarks = face_recognition.face_landmarks(image_array, [face_location])

            if not landmarks:
                print("Failed to detect facial landmarks")
                return None

            return landmarks[0]  # Return the first face's landmarks
        except Exception as e:
            print(f"Error detecting facial landmarks: {e}")
            return None

    @staticmethod
    def estimate_face_pose(landmarks):
        """
        Estimate the pose of a face using facial landmarks.
        Returns (yaw, pitch, roll) in degrees or None if landmarks are None.
        """
        if not landmarks:
            return None

        try:
            # Extract key points
            # For yaw (left-right): compare distance between left eye and left face edge vs right eye and right face edge
            left_eye = np.mean(np.array(landmarks['left_eye']), axis=0)
            right_eye = np.mean(np.array(landmarks['right_eye']), axis=0)
            nose_tip = landmarks['nose_tip'][0]  # Use tip of nose
            chin = landmarks['chin'][8]  # Use middle of chin

            # Calculate distances
            eye_distance = np.linalg.norm(right_eye - left_eye)

            # Estimate yaw (left-right rotation)
            eye_center = (left_eye + right_eye) / 2
            nose_offset = nose_tip[0] - eye_center[0]
            yaw = math.degrees(math.atan2(nose_offset, eye_distance / 2)) * 2

            # Estimate pitch (up-down rotation)
            eye_to_nose_y = nose_tip[1] - eye_center[1]
            eye_to_chin_y = chin[1] - eye_center[1]
            pitch_ratio = eye_to_nose_y / eye_to_chin_y if eye_to_chin_y != 0 else 0
            pitch = (pitch_ratio - 0.4) * 90  # Normalize and scale to degrees

            # Estimate roll (tilt)
            if right_eye[1] - left_eye[1] != 0:
                roll = math.degrees(math.atan2(right_eye[1] - left_eye[1], right_eye[0] - left_eye[0]))
            else:
                roll = 0

            return {'yaw': yaw, 'pitch': pitch, 'roll': roll}
        except Exception as e:
            print(f"Error estimating face pose: {e}")
            return {'yaw': 0, 'pitch': 0, 'roll': 0}

    @staticmethod
    def analyze_face(image_array, face_location):
        """
        Analyze a face to extract features and pose information.
        Returns a dictionary with analysis results.
        """
        try:
            # Get facial landmarks
            landmarks = FaceRecognitionService.detect_facial_landmarks(image_array, face_location)
            if not landmarks:
                return {"status": "error", "message": "Could not detect facial landmarks"}

            # Estimate face pose
            pose = FaceRecognitionService.estimate_face_pose(landmarks)

            # Determine if pose is good for recognition
            pose_quality = "good"
            pose_recommendation = None

            if pose:
                # Check if pose is within acceptable range
                if abs(pose['yaw']) > 30:
                    pose_quality = "poor"
                    if pose['yaw'] > 0:
                        pose_recommendation = "Turn your head slightly to the right"
                    else:
                        pose_recommendation = "Turn your head slightly to the left"
                elif abs(pose['pitch']) > 20:
                    pose_quality = "poor"
                    if pose['pitch'] > 0:
                        pose_recommendation = "Tilt your head up slightly"
                    else:
                        pose_recommendation = "Tilt your head down slightly"
                elif abs(pose['roll']) > 15:
                    pose_quality = "poor"
                    if pose['roll'] > 0:
                        pose_recommendation = "Straighten your head (it's tilted)"
                    else:
                        pose_recommendation = "Straighten your head (it's tilted)"

            # Return analysis results
            result = {
                "status": "success",
                "pose": pose,
                "pose_quality": pose_quality,
            }

            if pose_recommendation:
                result["pose_recommendation"] = pose_recommendation

            return result
        except Exception as e:
            print(f"Error analyzing face: {e}")
            return {"status": "error", "message": f"Error analyzing face: {str(e)}"}

    @staticmethod
    def align_face(image_array, landmarks):
        """
        Align face to a standard orientation using facial landmarks.
        Returns aligned face image array or original image if alignment fails.
        """
        if landmarks is None:
            return image_array

        try:
            # Get the eyes from the landmarks
            left_eye = np.mean(np.array(landmarks['left_eye']), axis=0)
            right_eye = np.mean(np.array(landmarks['right_eye']), axis=0)

            # Calculate angle and transformation matrix
            dx = right_eye[0] - left_eye[0]
            dy = right_eye[1] - left_eye[1]
            angle = math.degrees(math.atan2(dy, dx))

            # Get face center
            face_center = np.mean([np.mean(np.array(landmarks['left_eye']), axis=0),
                                np.mean(np.array(landmarks['right_eye']), axis=0)], axis=0)
            face_center = tuple(map(int, face_center))

            # Create rotation matrix
            M = cv2.getRotationMatrix2D(face_center, angle, 1)

            # Apply transformation
            height, width = image_array.shape[:2]
            aligned_image = cv2.warpAffine(image_array, M, (width, height), flags=cv2.INTER_CUBIC)

            return aligned_image
        except Exception as e:
            print(f"Error aligning face: {e}")
            return image_array

    @staticmethod
    def detect_faces(image_array):
        """
        Detect face locations in an image.
        Returns list of face locations or empty list if none found.
        Uses HOG model by default for performance, falls back to CNN if needed.
        """
        try:
            # First try with HOG model (faster)
            with FACE_RECOGNITION_LOCK:
                face_locations = face_recognition.face_locations(image_array, model="hog")

            # If no faces found and CNN model is enabled, try with CNN model (more accurate but slower)
            if not face_locations and os.environ.get('USE_CNN_MODEL', 'false').lower() == 'true':
                print("No faces found with HOG model, trying CNN model...")
                with FACE_RECOGNITION_LOCK:
                    face_locations = face_recognition.face_locations(image_array, model="cnn")

            return face_locations
        except Exception as e:
            print(f"Error detecting faces: {e}")
            return []

    @staticmethod
    def encode_face(image_array, face_location=None):
        """
        Generate face encoding for a face in an image.
        If face_location not provided, detects the first face.
        Returns face encoding or None if no face detected.
        """
        try:
            # If no face location provided, detect faces first
            if not face_location:
                with FACE_RECOGNITION_LOCK:
                    face_locations = face_recognition.face_locations(image_array)
                if not face_locations:
                    print("No faces detected in image")
                    return None
                face_location = face_locations[0]  # Use the first face

            # Get facial landmarks for the face
            landmarks = FaceRecognitionService.detect_facial_landmarks(image_array, face_location)

            # Align face if landmarks were detected
            if landmarks:
                aligned_image = FaceRecognitionService.align_face(image_array, landmarks)
                # Use aligned image for encoding
                with FACE_RECOGNITION_LOCK:
                    face_encodings = face_recognition.face_encodings(aligned_image, [face_location], num_jitters=JITTER_COUNT)
            else:
                # Fall back to original image if landmarks weren't detected
                with FACE_RECOGNITION_LOCK:
                    face_encodings = face_recognition.face_encodings(image_array, [face_location], num_jitters=JITTER_COUNT)

            if not face_encodings:
                print("Failed to generate face encoding")
                return None

            # Return the first encoding
            return face_encodings[0]
        except Exception as e:
            print(f"Error encoding face: {e}")
            return None

    @staticmethod
    def encode_face_multi_angle(image_array, face_location=None):
        """
        Generate multiple face encodings with various virtual poses.
        This helps with recognizing faces from different angles.
        Returns a list of encodings or None if face detection fails.
        """
        try:
            # If no face location provided, detect faces first
            if not face_location:
                with FACE_RECOGNITION_LOCK:
                    face_locations = face_recognition.face_locations(image_array)
                if not face_locations:
                    print("No faces detected in image")
                    return None
                face_location = face_locations[0]  # Use the first face

            # Get facial landmarks
            landmarks = FaceRecognitionService.detect_facial_landmarks(image_array, face_location)
            if not landmarks:
                # Fall back to regular encoding if landmarks detection fails
                print("Could not detect landmarks for multi-angle encoding, using standard encoding")
                encoding = FaceRecognitionService.encode_face(image_array, face_location)
                return [encoding] if encoding is not None else None

            # Get baseline aligned face
            aligned_image = FaceRecognitionService.align_face(image_array, landmarks)

            # Generate face encoding with higher jitter for the aligned face
            with FACE_RECOGNITION_LOCK:
                base_encoding = face_recognition.face_encodings(aligned_image, [face_location], num_jitters=MULTI_ANGLE_JITTER)

            if not base_encoding:
                print("Failed to generate base face encoding")
                return None

            # Create a list to store all encodings
            all_encodings = [base_encoding[0]]

            # Create slight variations of the image to simulate different angles
            # This helps with recognition from different perspectives
            try:
                # Create a PIL Image for transformations
                from PIL import Image
                pil_img = Image.fromarray(aligned_image)

                # Slight left rotation (yaw)
                left_img = pil_img.rotate(5, resample=Image.BICUBIC, expand=False)
                left_array = np.array(left_img)
                with FACE_RECOGNITION_LOCK:
                    left_encoding = face_recognition.face_encodings(left_array, [face_location], num_jitters=MULTI_ANGLE_JITTER)
                if left_encoding:
                    all_encodings.append(left_encoding[0])

                # Slight right rotation (yaw)
                right_img = pil_img.rotate(-5, resample=Image.BICUBIC, expand=False)
                right_array = np.array(right_img)
                with FACE_RECOGNITION_LOCK:
                    right_encoding = face_recognition.face_encodings(right_array, [face_location], num_jitters=MULTI_ANGLE_JITTER)
                if right_encoding:
                    all_encodings.append(right_encoding[0])

                # Slight up tilt (pitch)
                # For pitch, we need to use affine transformation
                height, width = aligned_image.shape[:2]
                up_transform = np.array([[1, 0, 0], [0, 1.03, -height * 0.01]])
                up_img = pil_img.transform(
                    (width, height),
                    Image.AFFINE,
                    (1, 0, 0, 0, 1.03, -height * 0.01),
                    resample=Image.BICUBIC
                )
                up_array = np.array(up_img)
                with FACE_RECOGNITION_LOCK:
                    up_encoding = face_recognition.face_encodings(up_array, [face_location], num_jitters=MULTI_ANGLE_JITTER)
                if up_encoding:
                    all_encodings.append(up_encoding[0])

                # Slight down tilt (pitch)
                down_img = pil_img.transform(
                    (width, height),
                    Image.AFFINE,
                    (1, 0, 0, 0, 0.97, height * 0.01),
                    resample=Image.BICUBIC
                )
                down_array = np.array(down_img)
                with FACE_RECOGNITION_LOCK:
                    down_encoding = face_recognition.face_encodings(down_array, [face_location], num_jitters=MULTI_ANGLE_JITTER)
                if down_encoding:
                    all_encodings.append(down_encoding[0])

                print(f"Generated {len(all_encodings)} multi-angle encodings")
            except Exception as transform_error:
                print(f"Error generating angle variations: {transform_error}")
                # Continue with just the base encoding if transformations fail

            return all_encodings
        except Exception as e:
            print(f"Error encoding face with multi-angle: {e}")
            return None

    @staticmethod
    def compare_faces(known_encoding, unknown_encoding, tolerance=0.55, poses=None):
        """
        Compare face encodings and determine if they match.
        Uses a slightly more strict tolerance (0.55 instead of 0.6).

        If poses is provided (format: {"known": {...}, "unknown": {...}}),
        adjust tolerance based on pose difference to better handle varied angles.

        Returns (match_result, distance).
        """
        try:
            # Convert from bytes to numpy array if needed
            if isinstance(known_encoding, bytes):
                known_encoding = np.frombuffer(known_encoding, dtype=np.float64)

            if isinstance(unknown_encoding, bytes):
                unknown_encoding = np.frombuffer(unknown_encoding, dtype=np.float64)

            # Adjust tolerance based on pose difference if poses are provided
            adjusted_tolerance = tolerance
            if poses and 'known' in poses and 'unknown' in poses:
                # Calculate pose difference
                yaw_diff = abs(poses['known'].get('yaw', 0) - poses['unknown'].get('yaw', 0))
                pitch_diff = abs(poses['known'].get('pitch', 0) - poses['unknown'].get('pitch', 0))

                # The greater the difference in pose, the more we relax the tolerance
                pose_diff_factor = (yaw_diff + pitch_diff) / 90.0  # Normalize to 0-1 range
                pose_adjustment = pose_diff_factor * POSE_TOLERANCE_ADJUSTMENT

                # Adjust tolerance (relax it for different poses)
                adjusted_tolerance = min(tolerance + pose_adjustment, 0.65)  # Cap at 0.65

            # Compare faces
            with FACE_RECOGNITION_LOCK:
                distances = face_recognition.face_distance([known_encoding], unknown_encoding)

            match = distances[0] <= adjusted_tolerance

            return match, distances[0], adjusted_tolerance
        except Exception as e:
            print(f"Error comparing faces: {e}")
            return False, 1.0, tolerance  # Return no match and max distance on error

    @staticmethod
    def encode_to_bytes(face_encoding):
        """Convert face encoding to bytes for storage"""
        if face_encoding is None:
            return None
        return face_encoding.tobytes()

    @staticmethod
    def decode_from_bytes(face_encoding_bytes):
        """Convert bytes back to face encoding"""
        if face_encoding_bytes is None:
            return None
        return np.frombuffer(face_encoding_bytes, dtype=np.float64)

    @staticmethod
    def encode_multiple_to_bytes(face_encodings):
        """Convert multiple face encodings to bytes for storage"""
        if not face_encodings:
            return None
        
        # Concatenate all encodings into a single byte string with a separator
        all_bytes = b''
        for encoding in face_encodings:
            encoding_bytes = encoding.tobytes()
            # Store the length of each encoding followed by the encoding itself
            length_bytes = len(encoding_bytes).to_bytes(4, byteorder='big')
            all_bytes += length_bytes + encoding_bytes
            
        return all_bytes

    @staticmethod
    def decode_multiple_from_bytes(multi_encodings_bytes):
        """Convert bytes back to multiple face encodings"""
        if multi_encodings_bytes is None:
            return None
            
        encodings = []
        offset = 0
        
        while offset < len(multi_encodings_bytes):
            # Read the length of the next encoding
            length = int.from_bytes(multi_encodings_bytes[offset:offset+4], byteorder='big')
            offset += 4
            
            # Read the encoding
            encoding_bytes = multi_encodings_bytes[offset:offset+length]
            encoding = np.frombuffer(encoding_bytes, dtype=np.float64)
            encodings.append(encoding)
            
            offset += length
            
        return encodings
