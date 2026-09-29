import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { UserFormValue, UserListResponse, UserRecord, UserResponse } from './user.models';
import { UserService } from './user.service';

const user: UserRecord = {
  id: 'user-1', code: 'USR-000001', name: 'Ada Lovelace', email: 'ada@example.com',
  phone: '+521234567890', photo: 'users/USR-000001/photo.png', is_active: true,
  profile_ids: ['profile-1'],
  profiles: [{ id: 'profile-1', code: 'PRF-000001', name: 'Administración', sections: ['users'] }]
};

const formValue: UserFormValue = {
  name: user.name,
  email: user.email,
  phone: user.phone ?? '',
  password: 'Password123!',
  password_confirmation: 'Password123!',
  profile_ids: user.profile_ids
};

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista usuarios con paginación y filtros', () => {
    const listUser = { ...user } as Partial<UserRecord>;
    delete listUser.profiles;
    const response: UserListResponse = {
      success: true, message: 'Usuarios obtenidos correctamente.', data: [listUser as UserRecord],
      meta: { page: 2, limit: 20, total: 21 }
    };
    service.list({ page: 2, limit: 20, search: 'ada', is_active: true }).subscribe(result => {
      expect(result.data[0].profiles).toEqual([]);
      expect(result.meta).toEqual(response.meta);
    });
    const request = http.expectOne(req => req.url === `${environment.apiUrl}/users`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('search')).toBe('ada');
    expect(request.request.params.get('is_active')).toBe('true');
    request.flush(response);
  });

  it('crea un usuario como multipart/form-data', () => {
    const photo = new File(['photo'], 'photo.png', { type: 'image/png' });
    service.create(formValue, photo).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/users`);
    const body = request.request.body as FormData;
    expect(request.request.method).toBe('POST');
    expect(body.get('email')).toBe(user.email);
    expect((body.get('photo') as File).name).toBe('photo.png');
    expect((body.get('photo') as File).type).toBe('image/png');
    expect(body.getAll('profile_ids[]')).toEqual(['profile-1']);
    request.flush({ success: true, message: 'Usuario creado correctamente.', data: user } satisfies UserResponse);
  });

  it('consulta y actualiza el detalle de un usuario', () => {
    service.get(user.id).subscribe();
    http.expectOne(`${environment.apiUrl}/users/${user.id}`).flush({ success: true, message: 'OK', data: user });

    service.update(user.id, { ...formValue, password: '', password_confirmation: '' }, null).subscribe();
    const update = http.expectOne(`${environment.apiUrl}/users/${user.id}`);
    expect(update.request.method).toBe('POST');
    expect((update.request.body as FormData).has('password')).toBeFalse();
    update.flush({ success: true, message: 'Usuario actualizado correctamente.', data: user });
  });

  it('actualiza estado y elimina usuarios', () => {
    service.updateStatus(user.id, false).subscribe();
    const status = http.expectOne(`${environment.apiUrl}/users/${user.id}/status`);
    expect(status.request.method).toBe('PATCH');
    expect(status.request.body).toEqual({ is_active: false });
    status.flush({ success: true, message: 'Estado actualizado.', data: { ...user, is_active: false } });

    service.delete(user.id).subscribe();
    const deletion = http.expectOne(`${environment.apiUrl}/users/${user.id}`);
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ success: true, message: 'Usuario eliminado correctamente.', data: null });
  });

  it('descarga exportaciones y obtiene perfiles', () => {
    service.export('pdf').subscribe();
    const exportRequest = http.expectOne(`${environment.apiUrl}/users/export/pdf`);
    expect(exportRequest.request.responseType).toBe('blob');
    exportRequest.flush(new Blob(['pdf'], { type: 'application/pdf' }));

    service.listProfiles().subscribe(profiles => expect(profiles[0].id).toBe('profile-1'));
    const profilesRequest = http.expectOne(req => req.url === `${environment.apiUrl}/profiles`);
    expect(profilesRequest.request.params.get('limit')).toBe('100');
    profilesRequest.flush({
      success: true, message: 'Perfiles obtenidos correctamente.', data: user.profiles,
      meta: { page: 1, limit: 100, total: 1 }
    });
  });
});
