/**
 * Type definitions for the RecognizeFace component
 */

import { User } from "../../types";

/**
 * Face analysis data with pose and quality information
 */
export interface FaceAnalysis {
  pose?: {
    yaw: number; // Left/right angle
    pitch: number; // Up/down angle
    roll: number; // Tilt angle
  };
  alignment_quality?: string;
  pose_recommendation?: string | string[];
  [key: string]: unknown;
}

/**
 * Diagnostic information for face recognition
 */
export interface DiagnosticInfo {
  face_detected?: boolean;
  encoding_generated?: boolean;
  comparisons?: number;
  near_matches_count?: number;
  face_analysis?: FaceAnalysis;
  pose_recommendation?: string | string[];
  error_type?: string;
  match_quality?: "high" | "medium" | "low";
  used_pose_adjustment?: boolean;
  used_multi_angle?: boolean;
  multi_angle_match?: boolean;
  [key: string]: unknown;
}

/**
 * Recognition response from the API
 */
export interface RecognizeResponse {
  status: string;
  recognized: boolean;
  message?: string;
  user?: User;
  match?: {
    user_id: string;
    name: string;
    face_id: string;
    image_path: string;
    confidence: number;
  };
  confidence?: number;
  possible_match?: boolean;
  diagnostic?: DiagnosticInfo;
}

/**
 * Props for the ImageCapture component
 */
export interface ImageCaptureProps {
  onImageCaptured: (file: File | null, previewUrl: string | null) => void;
  onProcessingStateChange: (isProcessing: boolean) => void;
  resetRecognitionState: () => void;
  loading: boolean;
  usingWebcam: boolean;
  setUsingWebcam: (value: boolean) => void;
  multiShotMode: boolean;
  setMultiShotMode: (value: boolean) => void;
  multiShotImages: string[];
  setMultiShotImages: (images: string[]) => void;
  poseGuidance: string[];
}

/**
 * Props for the UserInfoCard component
 */
export interface UserInfoCardProps {
  recognizedUser?: User;
  confidence: number;
  isPossibleMatch: boolean;
}

/**
 * Props for the FaceAnalysisDisplay component
 */
export interface FaceAnalysisDisplayProps {
  faceAnalysis?: FaceAnalysis;
  poseGuidance: string[];
  diagnosticInfo?: DiagnosticInfo;
}

/**
 * Props for the ErrorDisplay component
 */
export interface ErrorDisplayProps {
  error: string;
  diagnosticInfo?: DiagnosticInfo;
  poseGuidance: string[];
  previewUrl?: string;
  selectedFile?: File | null;
  faceAnalysis?: FaceAnalysis;
}

/**
 * Props for the ApiStatus component
 */
export interface ApiStatusProps {
  apiStatus: "live" | "mock" | "error";
  checkApiHealth: () => Promise<void>;
  loading: boolean;
}
