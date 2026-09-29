import { AuthUser, UserProfile } from '../../core/auth/auth.models';
import { PaginationMeta } from '../../core/models/api.models';

export type { PaginationMeta } from '../../core/models/api.models';

export type UserRecord = AuthUser;
export type ProfileOption = UserProfile;

export interface UserListResponse {
  success: boolean;
  message: string;
  data: UserRecord[];
  meta: PaginationMeta;
}

export interface UserQuery {
  page: number;
  limit: number;
  search?: string;
  is_active?: boolean;
}

export interface UserFormValue {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  profile_ids: string[];
}

export interface ProfileListResponse {
  success: boolean;
  message: string;
  data: ProfileOption[];
  meta: PaginationMeta;
}

export type UserResponse = {
  success: boolean;
  message: string;
  data: UserRecord;
};

export type EmptyUserResponse = {
  success: boolean;
  message: string;
  data: null;
};

export type UserExportFormat = 'pdf' | 'excel';
