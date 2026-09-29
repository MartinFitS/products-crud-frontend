import { PaginationMeta } from '../../core/models/api.models';

export type AuditAction = 'created' | 'updated' | 'status_updated' | 'deleted';
export type AuditableType = 'product' | 'user' | 'profile';
export type AuditExportFormat = 'pdf' | 'excel';

export interface AuditActor {
  id: string;
  code: string;
  name: string;
  email: string;
}

export interface AuditLogRecord {
  id: string;
  actor: AuditActor | null;
  action: AuditAction;
  auditable_type: AuditableType;
  auditable_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string | null;
}

export interface AuditLogFilters {
  search?: string;
  action?: AuditAction | '';
  auditable_type?: AuditableType | '';
  date_from?: string;
  date_to?: string;
}

export interface AuditLogListResponse {
  success: boolean;
  message: string;
  data: AuditLogRecord[];
  meta: PaginationMeta;
}

export interface AuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLogRecord;
}
