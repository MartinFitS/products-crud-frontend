import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuditExportFormat, AuditLogFilters, AuditLogListResponse, AuditLogResponse } from './audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly auditLogsUrl = `${environment.apiUrl}/audit-logs`;

  list(page: number, limit: number, filters: AuditLogFilters): Observable<AuditLogListResponse> {
    const params = this.toParams(filters).set('page', page).set('limit', limit);
    return this.http.get<AuditLogListResponse>(this.auditLogsUrl, { params });
  }

  get(id: string): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(`${this.auditLogsUrl}/${id}`);
  }

  export(format: AuditExportFormat, filters: AuditLogFilters): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.auditLogsUrl}/export/${format}`, {
      params: this.toParams(filters), observe: 'response', responseType: 'blob'
    });
  }

  private toParams(filters: AuditLogFilters): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value?.trim()) params = params.set(key, value.trim());
    }
    return params;
  }
}
