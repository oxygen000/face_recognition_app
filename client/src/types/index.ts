// User related types
export interface User {
  id: string;
  name: string;
  employee_id?: string;
  department?: string;
  role?: string;
  created_at: string;
  face_id?: string;
  image_url?: string;
  image_path?: string;
}

// Face analysis types
export interface FacePose {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface FaceAnalysis {
  pose?: FacePose;
  alignment_quality?: string;
  pose_recommendation?: string | string[];
  [key: string]: unknown;
}

export interface FaceAnalysisResponse {
  status: "success" | "error";
  message: string;
  face_detected: boolean;
  analysis_success: boolean;
  face_analysis?: FaceAnalysis;
}

// Import and export API response types
export * from "./api";

// Import and export client types
export * from "./client";

export interface RegisterResponse extends ApiResponse {
  user_id?: string;
  face_id?: string;
  user?: User;
  face_analysis?: FaceAnalysis;
  pose_recommendation?: string | string[];
}

export interface RecognizeResponse extends ApiResponse {
  recognized: boolean;
  possible_match?: boolean;
  user?: User;
  match?: {
    user_id: string;
    name: string;
    face_id: string;
    image_path?: string;
    confidence: number;
  };
  confidence?: number;
  diagnostic?: {
    face_detected?: boolean;
    encoding_generated?: boolean;
    comparisons?: number;
    match_quality?: "high" | "medium" | "low";
    face_analysis?: FaceAnalysis;
    pose_recommendation?: string | string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface UserListResponse extends ApiResponse {
  users?: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form data types
export interface UserFormData {
  name: string;
  employee_id?: string;
  department?: string;
  role?: string;
}
