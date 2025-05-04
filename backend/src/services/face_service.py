"""
Face recognition service for the Face Recognition API.
Provides functions for face detection, recognition, and encoding.
"""

import base64
import io
import json
import math
import numpy as np
import face_recognition
import cv2
from typing import List, Dict, Any, Optional, Tuple, Union
import sys
from pathlib import Path
import pickle

# Import config and logger
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import config
from utils.logger import get_logger

# Get logger
logger = get_logger("face_service")

class FaceService:
    """Service for face recognition operations."""
    
    def __init__(self):
        """Initialize the face service."""
        self.tolerance = config.FACE_RECOGNITION_TOLERANCE
        self.model = config.FACE_RECOGNITION_MODEL
        self.multi_angle_jitter = config.MULTI_ANGLE_JITTER
        logger.info(f"Face service initialized with tolerance={self.tolerance}, model={self.model}")
    
    def process_image(self, image_data: Union[str, bytes]) -> Optional[np.ndarray]:
        """
        Process an image from base64 or bytes to a numpy array.
        
        Args:
            image_data: The image data as base64 string or bytes
            
        Returns:
            The image as a numpy array or None if processing failed
        """
        try:
            # Handle base64 string
            if isinstance(image_data, str):
                # Check if the string is a base64 data URI
                if image_data.startswith('data:image'):
                    # Extract the base64 part
                    image_data = image_data.split(',')[1]
                
                # Decode base64
                image_bytes = base64.b64decode(image_data)
            else:
                # Already bytes
                image_bytes = image_data
            
            # Convert to numpy array
            image_array = np.frombuffer(image_bytes, dtype=np.uint8)
            
            # Decode image
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            # Convert from BGR to RGB (face_recognition uses RGB)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            return image_rgb
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return None
    
    def process_image_file(self, file_path: str) -> Optional[np.ndarray]:
        """
        Process an image file to a numpy array.
        
        Args:
            file_path: Path to the image file
            
        Returns:
            The image as a numpy array or None if processing failed
        """
        try:
            # Load image
            image = face_recognition.load_image_file(file_path)
            return image
        except Exception as e:
            logger.error(f"Error processing image file {file_path}: {e}")
            return None
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image.
        
        Args:
            image: The image as a numpy array
            
        Returns:
            A list of face locations as (top, right, bottom, left) tuples
        """
        try:
            # Detect faces
            face_locations = face_recognition.face_locations(image, model=self.model)
            logger.info(f"Detected {len(face_locations)} faces in image")
            return face_locations
        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
            return []
    
    def encode_face(
        self, 
        image: np.ndarray, 
        face_location: Optional[Tuple[int, int, int, int]] = None
    ) -> Optional[np.ndarray]:
        """
        Generate a face encoding for a face in an image.
        
        Args:
            image: The image as a numpy array
            face_location: The face location as (top, right, bottom, left) tuple
            
        Returns:
            The face encoding as a numpy array or None if encoding failed
        """
        try:
            # If no face location provided, detect faces
            if face_location is None:
                face_locations = self.detect_faces(image)
                if not face_locations:
                    logger.warning("No faces detected for encoding")
                    return None
                face_location = face_locations[0]
            
            # Generate face encoding
            face_encodings = face_recognition.face_encodings(image, [face_location])
            
            if not face_encodings:
                logger.warning("Failed to generate face encoding")
                return None
            
            logger.info("Generated face encoding successfully")
            return face_encodings[0]
        except Exception as e:
            logger.error(f"Error encoding face: {e}")
            return None
    
    def generate_multi_angle_encodings(
        self, 
        image: np.ndarray, 
        face_location: Tuple[int, int, int, int]
    ) -> List[np.ndarray]:
        """
        Generate multiple face encodings with slight variations for better recognition.
        
        Args:
            image: The image as a numpy array
            face_location: The face location as (top, right, bottom, left) tuple
            
        Returns:
            A list of face encodings
        """
        try:
            # Extract face from image
            top, right, bottom, left = face_location
            face_image = image[top:bottom, left:right]
            
            # Generate base encoding
            base_encoding = self.encode_face(image, face_location)
            if base_encoding is None:
                return []
            
            encodings = [base_encoding]
            
            # Generate additional encodings with slight rotations and scales
            height, width = face_image.shape[:2]
            center = (width // 2, height // 2)
            
            # Add slight rotations
            for angle in range(-self.multi_angle_jitter, self.multi_angle_jitter + 1, 5):
                if angle == 0:
                    continue  # Skip 0 as it's the base encoding
                
                # Rotation matrix
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(face_image, M, (width, height))
                
                # Create a new image with the rotated face
                new_image = image.copy()
                new_image[top:bottom, left:right] = rotated
                
                # Generate encoding
                encoding = self.encode_face(new_image, face_location)
                if encoding is not None:
                    encodings.append(encoding)
            
            # Add slight scales
            for scale in [0.95, 0.98, 1.02, 1.05]:
                # Scale matrix
                new_width = int(width * scale)
                new_height = int(height * scale)
                scaled = cv2.resize(face_image, (new_width, new_height))
                
                # Create a new image with the scaled face
                new_image = image.copy()
                
                # Calculate new face location
                new_top = max(0, top - int((new_height - height) / 2))
                new_left = max(0, left - int((new_width - width) / 2))
                new_bottom = min(image.shape[0], new_top + new_height)
                new_right = min(image.shape[1], new_left + new_width)
                
                # Adjust scaled image if it's too big
                scaled_height, scaled_width = scaled.shape[:2]
                if new_bottom - new_top < scaled_height or new_right - new_left < scaled_width:
                    scaled = cv2.resize(scaled, (new_right - new_left, new_bottom - new_top))
                
                # Place scaled face in new image
                new_image[new_top:new_bottom, new_left:new_right] = scaled
                
                # Generate encoding
                new_face_location = (new_top, new_right, new_bottom, new_left)
                encoding = self.encode_face(new_image, new_face_location)
                if encoding is not None:
                    encodings.append(encoding)
            
            logger.info(f"Generated {len(encodings)} multi-angle encodings")
            return encodings
        except Exception as e:
            logger.error(f"Error generating multi-angle encodings: {e}")
            return []
    
    def analyze_face(
        self, 
        image: np.ndarray, 
        face_location: Tuple[int, int, int, int]
    ) -> Dict[str, Any]:
        """
        Analyze a face to get pose and feature information.
        
        Args:
            image: The image as a numpy array
            face_location: The face location as (top, right, bottom, left) tuple
            
        Returns:
            A dictionary with face analysis information
        """
        try:
            # Extract face landmarks
            landmarks = face_recognition.face_landmarks(image, [face_location])
            
            if not landmarks:
                logger.warning("No landmarks detected for face analysis")
                return {}
            
            landmarks = landmarks[0]
            
            # Calculate face pose (approximate)
            pose = self._estimate_pose(landmarks)
            
            # Calculate face quality
            quality = self._estimate_quality(image, face_location, landmarks)
            
            # Generate pose recommendations if needed
            pose_recommendation = self._generate_pose_recommendations(pose)
            
            analysis = {
                "pose": pose,
                "alignment_quality": quality,
            }
            
            if pose_recommendation:
                analysis["pose_recommendation"] = pose_recommendation
            
            logger.info("Generated face analysis successfully")
            return analysis
        except Exception as e:
            logger.error(f"Error analyzing face: {e}")
            return {}
    
    def _estimate_pose(self, landmarks: Dict[str, List[Tuple[int, int]]]) -> Dict[str, float]:
        """
        Estimate the pose of a face from landmarks.
        
        Args:
            landmarks: Face landmarks
            
        Returns:
            A dictionary with pose information (yaw, pitch, roll)
        """
        try:
            # Get key points
            left_eye = self._get_center_point(landmarks.get('left_eye', []))
            right_eye = self._get_center_point(landmarks.get('right_eye', []))
            nose_tip = landmarks.get('nose_tip', [[0, 0]])[-1]
            
            if not all([left_eye, right_eye, nose_tip]):
                return {}
            
            # Calculate yaw (left/right)
            eye_line_center = ((left_eye[0] + right_eye[0]) / 2, (left_eye[1] + right_eye[1]) / 2)
            eye_to_nose = nose_tip[0] - eye_line_center[0]
            eye_distance = right_eye[0] - left_eye[0]
            
            # Normalize to -30 to 30 degrees
            yaw = (eye_to_nose / (eye_distance / 2)) * 30
            
            # Calculate pitch (up/down)
            eye_nose_distance = nose_tip[1] - eye_line_center[1]
            ideal_ratio = 0.8  # Ideal ratio of eye-to-nose distance to eye distance
            actual_ratio = eye_nose_distance / eye_distance
            
            # Normalize to -30 to 30 degrees
            pitch = (actual_ratio - ideal_ratio) * 60
            
            # Calculate roll (tilt)
            if right_eye[0] == left_eye[0]:
                roll = 0
            else:
                roll = math.degrees(math.atan2(
                    right_eye[1] - left_eye[1],
                    right_eye[0] - left_eye[0]
                ))
            
            return {
                "yaw": round(yaw, 2),
                "pitch": round(pitch, 2),
                "roll": round(roll, 2)
            }
        except Exception as e:
            logger.error(f"Error estimating pose: {e}")
            return {}
    
    def _get_center_point(self, points: List[Tuple[int, int]]) -> Tuple[float, float]:
        """
        Get the center point of a list of points.
        
        Args:
            points: List of (x, y) points
            
        Returns:
            The center point as (x, y)
        """
        if not points:
            return (0, 0)
        
        x_sum = sum(p[0] for p in points)
        y_sum = sum(p[1] for p in points)
        return (x_sum / len(points), y_sum / len(points))
    
    def _estimate_quality(
        self, 
        image: np.ndarray, 
        face_location: Tuple[int, int, int, int],
        landmarks: Dict[str, List[Tuple[int, int]]]
    ) -> str:
        """
        Estimate the quality of a face image.
        
        Args:
            image: The image as a numpy array
            face_location: The face location as (top, right, bottom, left) tuple
            landmarks: Face landmarks
            
        Returns:
            A quality rating ("excellent", "good", "fair", "poor")
        """
        try:
            # Extract face from image
            top, right, bottom, left = face_location
            face_image = image[top:bottom, left:right]
            
            # Calculate face size
            face_size = (right - left) * (bottom - top)
            image_size = image.shape[0] * image.shape[1]
            size_ratio = face_size / image_size
            
            # Calculate face brightness
            gray_face = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            brightness = np.mean(gray_face)
            
            # Calculate face contrast
            contrast = np.std(gray_face)
            
            # Calculate face sharpness
            laplacian = cv2.Laplacian(gray_face, cv2.CV_64F)
            sharpness = np.var(laplacian)
            
            # Calculate scores
            size_score = min(1.0, size_ratio * 20)  # Normalize to 0-1
            brightness_score = 1.0 - abs((brightness - 128) / 128)  # Normalize to 0-1
            contrast_score = min(1.0, contrast / 80)  # Normalize to 0-1
            sharpness_score = min(1.0, sharpness / 500)  # Normalize to 0-1
            
            # Calculate overall score
            overall_score = (size_score * 0.3 + 
                            brightness_score * 0.2 + 
                            contrast_score * 0.2 + 
                            sharpness_score * 0.3)
            
            # Determine quality rating
            if overall_score >= 0.8:
                return "excellent"
            elif overall_score >= 0.6:
                return "good"
            elif overall_score >= 0.4:
                return "fair"
            else:
                return "poor"
        except Exception as e:
            logger.error(f"Error estimating quality: {e}")
            return "unknown"
    
    def _generate_pose_recommendations(self, pose: Dict[str, float]) -> Optional[List[str]]:
        """
        Generate recommendations for improving face pose.
        
        Args:
            pose: Face pose information
            
        Returns:
            A list of recommendations or None if pose is good
        """
        if not pose:
            return None
        
        recommendations = []
        
        # Check yaw (left/right)
        yaw = pose.get('yaw', 0)
        if yaw < -15:
            recommendations.append("Turn your face slightly to the right")
        elif yaw > 15:
            recommendations.append("Turn your face slightly to the left")
        
        # Check pitch (up/down)
        pitch = pose.get('pitch', 0)
        if pitch < -15:
            recommendations.append("Tilt your face slightly upward")
        elif pitch > 15:
            recommendations.append("Tilt your face slightly downward")
        
        # Check roll (tilt)
        roll = pose.get('roll', 0)
        if abs(roll) > 10:
            recommendations.append("Keep your head level (not tilted)")
        
        return recommendations if recommendations else None
    
    def compare_faces(
        self, 
        known_encoding: np.ndarray, 
        unknown_encoding: np.ndarray,
        poses: Optional[Dict[str, Dict[str, float]]] = None
    ) -> Tuple[bool, float, float]:
        """
        Compare two face encodings to determine if they are the same person.
        
        Args:
            known_encoding: The known face encoding
            unknown_encoding: The unknown face encoding
            poses: Optional pose information for both faces
            
        Returns:
            A tuple of (match result, distance, adjusted tolerance)
        """
        try:
            # Calculate distance
            distance = face_recognition.face_distance([known_encoding], unknown_encoding)[0]
            
            # Adjust tolerance based on pose if available
            adjusted_tolerance = self.tolerance
            
            if poses and 'known' in poses and 'unknown' in poses:
                known_pose = poses['known']
                unknown_pose = poses['unknown']
                
                # Calculate pose difference
                yaw_diff = abs(known_pose.get('yaw', 0) - unknown_pose.get('yaw', 0))
                pitch_diff = abs(known_pose.get('pitch', 0) - unknown_pose.get('pitch', 0))
                roll_diff = abs(known_pose.get('roll', 0) - unknown_pose.get('roll', 0))
                
                # Increase tolerance for significant pose differences
                pose_adjustment = (yaw_diff / 90 + pitch_diff / 90 + roll_diff / 90) / 6
                adjusted_tolerance = min(0.8, self.tolerance + pose_adjustment)
                
                logger.debug(f"Adjusted tolerance from {self.tolerance} to {adjusted_tolerance} based on pose difference")
            
            # Determine match
            match = distance <= adjusted_tolerance
            
            return match, distance, adjusted_tolerance
        except Exception as e:
            logger.error(f"Error comparing faces: {e}")
            return False, 1.0, self.tolerance
    
    def encode_to_bytes(self, encoding: np.ndarray) -> bytes:
        """
        Convert a face encoding to bytes for storage.
        
        Args:
            encoding: The face encoding
            
        Returns:
            The encoding as bytes
        """
        return pickle.dumps(encoding)
    
    def decode_from_bytes(self, encoding_bytes: bytes) -> np.ndarray:
        """
        Convert bytes to a face encoding.
        
        Args:
            encoding_bytes: The face encoding as bytes
            
        Returns:
            The face encoding
        """
        return pickle.loads(encoding_bytes)
    
    def encode_multiple_to_bytes(self, encodings: List[np.ndarray]) -> bytes:
        """
        Convert multiple face encodings to bytes for storage.
        
        Args:
            encodings: The face encodings
            
        Returns:
            The encodings as bytes
        """
        return pickle.dumps(encodings)
    
    def decode_multiple_from_bytes(self, encodings_bytes: bytes) -> List[np.ndarray]:
        """
        Convert bytes to multiple face encodings.
        
        Args:
            encodings_bytes: The face encodings as bytes
            
        Returns:
            The face encodings
        """
        return pickle.loads(encodings_bytes)

# Create face service instance
face_service = FaceService()
