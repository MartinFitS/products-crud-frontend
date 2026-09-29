import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('bloquea a un usuario sin sesión', async () => {
    const result = TestBed.runInInjectionContext(() => authGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/products' } as RouterStateSnapshot
    ));
    const resolved = isObservable(result) ? await firstValueFrom(result) : await result;

    expect(resolved instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(resolved as UrlTree)).toBe('/login?returnUrl=%2Fproducts');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBeFalse();
  });
});
