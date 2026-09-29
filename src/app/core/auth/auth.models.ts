export interface UserProfile {
  id: string;
  code: string;
  name: string;
  sections: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuthUser {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  is_active: boolean;
  profile_ids: string[];
  profiles: UserProfile[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]> | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginData {
  user: AuthUser;
  token: string;
  token_type: 'Bearer' | string;
}

export type LoginResponse = ApiResponse<LoginData>;
export type MeResponse = ApiResponse<AuthUser>;
export type MessageResponse = ApiResponse<null>;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}
