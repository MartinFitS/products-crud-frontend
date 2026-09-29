import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuditLogListResponse, AuditLogRecord } from './audit-log.models';
import { AuditLogService } from './audit-log.service';

const entry: AuditLogRecord = {
  id: 'audit-1', actor: { id: 'user-1', code: 'USR-000001', name: 'Administrador', email: 'admin@example.com' },
  action: 'updated', auditable_type: 'product', auditable_id: 'product-1',
  old_values: { name: 'Anterior' }, new_values: { name: 'Nuevo' }, created_at: '2026-09-29T12:00:00Z'
};

describe('AuditLogService', () => {
  let service: AuditLogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuditLogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista la bitácora con paginación y filtros', () => {
    const response: AuditLogListResponse = { success: true, message: 'OK', data: [entry], meta: { page: 2, limit: 20, total: 21 } };
    service.list(2, 20, { search: 'admin', action: 'updated', auditable_type: 'product', date_from: '2026-09-01', date_to: '2026-09-30' }).subscribe(result => expect(result).toEqual(response));
    const request = http.expectOne(req => req.url === `${environment.apiUrl}/audit-logs`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('search')).toBe('admin');
    expect(request.request.params.get('action')).toBe('updated');
    expect(request.request.params.get('auditable_type')).toBe('product');
    expect(request.request.params.get('date_from')).toBe('2026-09-01');
    expect(request.request.params.get('date_to')).toBe('2026-09-30');
    request.flush(response);
  });

  it('omite filtros vacíos', () => {
    service.list(1, 10, { search: ' ', action: '', auditable_type: '', date_from: '', date_to: '' }).subscribe();
    const request = http.expectOne(req => req.url === `${environment.apiUrl}/audit-logs`);
    expect(request.request.params.keys().sort()).toEqual(['limit', 'page']);
    request.flush({ success: true, message: 'OK', data: [], meta: { page: 1, limit: 10, total: 0 } });
  });

  it('consulta el detalle inmutable', () => {
    service.get(entry.id).subscribe(result => expect(result.data).toEqual(entry));
    const request = http.expectOne(`${environment.apiUrl}/audit-logs/${entry.id}`);
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, message: 'OK', data: entry });
  });

  it('exporta la bitácora conservando filtros', () => {
    service.export('excel', { action: 'deleted', auditable_type: 'user' }).subscribe();
    const request = http.expectOne(req => req.url === `${environment.apiUrl}/audit-logs/export/excel`);
    expect(request.request.responseType).toBe('blob');
    expect(request.request.params.get('action')).toBe('deleted');
    expect(request.request.params.get('auditable_type')).toBe('user');
    request.flush(new Blob(['xlsx']));
  });
});
