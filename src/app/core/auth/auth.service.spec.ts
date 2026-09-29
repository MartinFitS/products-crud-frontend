import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthUser, LoginResponse } from './auth.models';
import { AuthService } from './auth.service';
import { AUTH_TOKEN_KEY } from './auth.store';

const user: AuthUser = {
  id: 'user-1',
  code: 'USR-000001',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: null,
  photo: null,
  is_active: true,
  profile_ids: ['profile-1'],
  profiles: [{ id: 'profile-1', code: 'PRO-1', name: 'Operación', sections: ['products'] }]
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('guarda el token y usuario al iniciar sesión', () => {
    const response: LoginResponse = {
      success: true,
      message: 'Inicio de sesión correcto.',
      data: { user, token: 'token-123', token_type: 'Bearer' }
    };

    service.login({ email: user.email, password: 'Password1!' }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    request.flush(response);

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('token-123');
    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('limpia la sesión aunque logout finalice localmente', () => {
    service.store.setSession('token-123', user);

    service.logout().subscribe();
    const request = http.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(request.request.method).toBe('POST');
    request.flush({ success: true, message: 'Sesión cerrada correctamente.', data: null });

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
