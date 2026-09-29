import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';

import { AuthUser } from './auth.models';
import { AuthService } from './auth.service';
import { sectionGuard } from './section.guard';

const user: AuthUser = {
  id: 'user-1', code: 'USR-1', name: 'Ada', email: 'ada@example.com', phone: null, photo: null,
  is_active: true, profile_ids: ['profile-1'],
  profiles: [{ id: 'profile-1', code: 'PRO-1', name: 'Operación', sections: ['products'] }]
};

describe('sectionGuard', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
    auth = TestBed.inject(AuthService);
    auth.store.setSession('token-123', user);
  });

  async function run(section: string): Promise<unknown> {
    const route = { data: { section } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => sectionGuard(route, {} as RouterStateSnapshot));
    return isObservable(result) ? firstValueFrom(result) : result;
  }

  it('permite una sección asignada', async () => {
    expect(await run('products')).toBeTrue();
  });

  it('redirige una sección no asignada a la primera permitida', async () => {
    const result = await run('users');
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/products');
  });
});
