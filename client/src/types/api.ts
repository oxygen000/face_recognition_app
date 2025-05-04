import { User } from "./index";

/**
 * Base API response interface
 */
export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
  user?: User;
  users?: User[];
}

/**
 * User list response
 */
export interface UserListResponse extends ApiResponse<User[]> {
  users?: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * User detail response
 */
export interface UserDetailResponse {
  status: "success" | "error";
  message?: string;
  user?: User;
  data?: User;
}

/**
 * Recognition response
 */
export interface RecognitionResponse {
  status: "success" | "error";
  message?: string;
  recognized?: boolean;
  user?: User;
  data?: User;
  confidence?: number;
  diagnostic?: any;
}

/**
 * Registration response
 */
export interface RegistrationResponse {
  status: "success" | "error";
  message?: string;
  user_id?: string;
  face_id?: string;
  user?: User;
  data?: User;
}
