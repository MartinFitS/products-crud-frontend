import { UserProfile } from '../../core/auth/auth.models';
import { PaginationMeta } from '../../core/models/api.models';

export type ProfileRecord = UserProfile;

export interface SectionRecord {
  id: string;
  code: string;
  name: string;
  slug: string;
  is_system: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ProfileListResponse {
  success: boolean;
  message: string;
  data: ProfileRecord[];
  meta: PaginationMeta;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: ProfileRecord;
}

export interface ProfileFormValue {
  name: string;
  sections: string[];
}

export interface SectionListResponse {
  success: boolean;
  message: string;
  data: SectionRecord[];
}

export interface SectionResponse {
  success: boolean;
  message: string;
  data: SectionRecord;
}

export interface EmptyProfileResponse {
  success: boolean;
  message: string;
  data: null;
}

export type ProfileExportFormat = 'pdf' | 'excel';
