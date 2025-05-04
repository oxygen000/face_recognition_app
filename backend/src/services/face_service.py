import base64
import io
import math
import sys
import numpy as np
import cv2
import face_recognition
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Union

# Append parent directory to import config and logger
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import config
from utils.logger import get_logger

logger = get_logger("face_service")

class FaceService:
    """Face recognition service for image processing and analysis."""

    def __init__(self):
        self.tolerance = config.FACE_RECOGNITION_TOLERANCE
        self.model = config.FACE_RECOGNITION_MODEL  # "cnn" for higher accuracy
        self.multi_angle_jitter = config.MULTI_ANGLE_JITTER  # e.g., 15
        self.num_jitters = config.FACE_ENCODING_JITTERS  # e.g., 5
        logger.info(f"Initialized FaceService with tolerance={self.tolerance}, model={self.model}, num_jitters={self.num_jitters}")

    def _decode_image(self, image_data: Union[str, bytes]) -> Optional[np.ndarray]:
        """Decode image data (base64 or bytes) to a NumPy array."""
        try:
            if isinstance(image_data, str):
                if image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data

            image_array = np.frombuffer(image_bytes, dtype=np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        except Exception as e:
            logger.error(f"Failed to decode image: {e}")
            return None

    def process_image_file(self, file_path: str) -> Optional[np.ndarray]:
        """Load an image file and return it as a NumPy array."""
        try:
            return face_recognition.load_image_file(file_path)
        except Exception as e:
            logger.error(f"Error loading image file {file_path}: {e}")
            return None

    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect face locations in an image."""
        try:
            locations = face_recognition.face_locations(image, model=self.model)
            logger.info(f"Detected {len(locations)} faces.")
            return locations
        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return []

    def encode_face(
        self, image: np.ndarray, face_location: Optional[Tuple[int, int, int, int]] = None
    ) -> Optional[np.ndarray]:
        """Generate a 128-d face encoding."""
        try:
            if not face_location:
                faces = self.detect_faces(image)
                if not faces:
                    logger.warning("No face detected for encoding.")
                    return None
                face_location = faces[0]

            encodings = face_recognition.face_encodings(
                image, [face_location], num_jitters=self.num_jitters
            )
            if not encodings:
                logger.warning("Encoding failed.")
                return None

            return encodings[0]
        except Exception as e:
            logger.error(f"Encoding error: {e}")
            return None

    def _adjust_brightness_contrast(self, image: np.ndarray, alpha: float, beta: int) -> np.ndarray:
        """Adjust brightness and contrast of an image."""
        return cv2.convertScaleAbs(image, alpha=alpha, beta=beta)

    def generate_multi_angle_encodings(
        self, image: np.ndarray, face_location: Tuple[int, int, int, int]
    ) -> List[np.ndarray]:
        """Generate multiple encodings with small variations to improve accuracy."""
        try:
            top, right, bottom, left = face_location
            face_img = image[top:bottom, left:right]
            encodings = []

            base_encoding = self.encode_face(image, face_location)
            if base_encoding is None:
                return []

            encodings.append(base_encoding)

            height, width = face_img.shape[:2]
            center = (width // 2, height // 2)

            # Rotation jitter
            for angle in range(-self.multi_angle_jitter, self.multi_angle_jitter + 1, 3):
                if angle == 0:
                    continue
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(face_img, M, (width, height))
                temp_image = image.copy()
                temp_image[top:bottom, left:right] = rotated
                enc = self.encode_face(temp_image, face_location)
                if enc is not None:
                    encodings.append(enc)

            # Scaling jitter
            for scale in [0.95, 0.98, 1.02, 1.05]:
                new_w, new_h = int(width * scale), int(height * scale)
                scaled = cv2.resize(face_img, (new_w, new_h))
                temp_image = image.copy()

                new_top = max(0, top - (new_h - height) // 2)
                new_left = max(0, left - (new_w - width) // 2)
                new_bottom = min(image.shape[0], new_top + new_h)
                new_right = min(image.shape[1], new_left + new_w)

                scaled = cv2.resize(scaled, (new_right - new_left, new_bottom - new_top))
                temp_image[new_top:new_bottom, new_left:new_right] = scaled

                new_loc = (new_top, new_right, new_bottom, new_left)
                enc = self.encode_face(temp_image, new_loc)
                if enc is not None:
                    encodings.append(enc)

            # Brightness and contrast adjustments
            for alpha in [0.9, 1.0, 1.1]:
                for beta in [-10, 0, 10]:
                    adjusted = self._adjust_brightness_contrast(face_img, alpha, beta)
                    temp_image = image.copy()
                    temp_image[top:bottom, left:right] = adjusted
                    enc = self.encode_face(temp_image, face_location)
                    if enc is not None:
                        encodings.append(enc)

            logger.info(f"Generated {len(encodings)} encodings with jitter.")
            return encodings
        except Exception as e:
            logger.error(f"Multi-angle encoding error: {e}")
            return []

    def average_encodings(self, encodings: List[np.ndarray]) -> Optional[np.ndarray]:
        """Compute the average of multiple face encodings."""
        if not encodings:
            return None
        return np.mean(encodings, axis=0)

    def analyze_face(
        self, image: np.ndarray, face_location: Tuple[int, int, int, int]
    ) -> Dict[str, Any]:
        """Analyze face alignment and provide pose estimation."""
        try:
            landmarks_list = face_recognition.face_landmarks(image, [face_location])
            if not landmarks_list:
                logger.warning("No landmarks found.")
                return {}

            landmarks = landmarks_list[0]
            pose = self._estimate_pose(landmarks)
            quality = self._estimate_quality(image, face_location, landmarks)
            recommendation = self._generate_pose_recommendations(pose)

            return {
                "pose": pose,
                "alignment_quality": quality,
                "pose_recommendation": recommendation,
            }
        except Exception as e:
            logger.error(f"Face analysis error: {e}")
            return {}

    def _estimate_pose(self, landmarks: Dict[str, List[Tuple[int, int]]]) -> Dict[str, float]:
        """Estimate face pose based on landmarks."""
        try:
            left_eye = self._get_center(landmarks.get("left_eye", []))
            right_eye = self._get_center(landmarks.get("right_eye", []))
            nose_tip = landmarks.get("nose_tip", [(0, 0)])[-1]

            if not (left_eye and right_eye and nose_tip):
                return {}

            eye_center = ((left_eye[0] + right_eye[0]) / 2, (left_eye[1] + right_eye[1]) / 2)
            yaw = ((nose_tip[0] - eye_center[0]) / ((right_eye[0] - left_eye[0]) / 2)) * 30

            eye_to_nose_y = nose_tip[1] - eye_center[1]
            eye_distance = right_eye[0] - left_eye[0]
            pitch = ((eye_to_nose_y / eye_distance) - 0.8) * 60

            roll = 0
            if right_eye[0] != left_eye[0]:
                slope = (right_eye[1] - left_eye[1]) / (right_eye[0] - left_eye[0])
                roll = math.degrees(math.atan(slope))

            return {"yaw": round(yaw, 2), "pitch": round(pitch, 2), "roll": round(roll, 2)}
        except Exception as e:
            logger.error(f"Pose estimation error: {e}")
            return {}

    def _get_center(self, points: List[Tuple[int, int]]) -> Optional[Tuple[int, int]]:
        """Calculate the center point of a list of points."""
        if not points:
            return None
        xs, ys = zip(*points)
        return int(sum(xs) / len(xs)), int(sum(ys) / len(ys))

    def _estimate_quality(
        self, image: np.ndarray, face_loc: Tuple[int, int, int, int], landmarks: Dict[str, List[Tuple[int, int]]]
    ) -> float:
        """Estimate image quality. Placeholder for actual implementation."""
        top, right, bottom, left = face_loc
        face_img = image[top:bottom, left:right]
        gray = cv2.cvtColor(face_img, cv2.COLOR_RGB2GRAY)
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())

    def _generate_pose_recommendations(self, pose: Dict[str, float]) -> Optional[str]:
        """Generate pose adjustment recommendation based on thresholds."""
        if not pose:
            return None
        if abs(pose["yaw"]) > 20:
            return "Please face the camera more directly."
        if abs(pose["pitch"]) > 20:
            return "Please adjust the vertical angle of your face."
        if abs(pose["roll"]) > 20:
            return "Please level your head."
        return None
