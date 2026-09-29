import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ProfileListResponse, ProfileRecord, SectionRecord } from './profile.models';
import { ProfileService } from './profile.service';

const profile: ProfileRecord = {
  id: 'profile-1', code: 'PRF-000001', name: 'Administración', sections: ['users', 'profiles']
};
const section: SectionRecord = {
  id: 'section-1', code: 'SEC-000001', name: 'Usuarios', slug: 'users', is_system: true
};

describe('ProfileService', () => {
  let service: ProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista perfiles con búsqueda y paginación', () => {
    const response: ProfileListResponse = {
      success: true, message: 'OK', data: [profile], meta: { page: 2, limit: 20, total: 21 }
    };
    service.list(2, 20, 'admin').subscribe(result => expect(result).toEqual(response));
    const request = http.expectOne(req => req.url === `${environment.apiUrl}/profiles`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('search')).toBe('admin');
    request.flush(response);
  });

  it('crea un perfil con secciones', () => {
    service.create({ name: profile.name, sections: profile.sections }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/profiles`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: profile.name, sections: profile.sections });
    request.flush({ success: true, message: 'Creado', data: profile });
  });

  it('consulta y actualiza un perfil', () => {
    service.get(profile.id).subscribe();
    http.expectOne(`${environment.apiUrl}/profiles/${profile.id}`).flush({ success: true, message: 'OK', data: profile });

    service.update(profile.id, { name: 'Supervisión', sections: ['products'] }).subscribe();
    const update = http.expectOne(`${environment.apiUrl}/profiles/${profile.id}`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ name: 'Supervisión', sections: ['products'] });
    update.flush({ success: true, message: 'Actualizado', data: { ...profile, name: 'Supervisión' } });
  });

  it('elimina y exporta perfiles', () => {
    service.delete(profile.id).subscribe();
    const deletion = http.expectOne(`${environment.apiUrl}/profiles/${profile.id}`);
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ success: true, message: 'Eliminado', data: null });

    service.export('excel').subscribe();
    const exportRequest = http.expectOne(`${environment.apiUrl}/profiles/export/excel`);
    expect(exportRequest.request.responseType).toBe('blob');
    exportRequest.flush(new Blob(['xlsx']));
  });

  it('lista y crea secciones', () => {
    service.listSections().subscribe(result => expect(result.data).toEqual([section]));
    http.expectOne(`${environment.apiUrl}/sections`).flush({ success: true, message: 'OK', data: [section] });

    service.createSection('Reportes', '').subscribe();
    const creation = http.expectOne(`${environment.apiUrl}/sections`);
    expect(creation.request.method).toBe('POST');
    expect(creation.request.body).toEqual({ name: 'Reportes' });
    creation.flush({ success: true, message: 'Creada', data: { ...section, name: 'Reportes', is_system: false } });
  });

  it('elimina una sección personalizada', () => {
    service.deleteSection(section.id).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/sections/${section.id}`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ success: true, message: 'Eliminada', data: null });
  });
});
