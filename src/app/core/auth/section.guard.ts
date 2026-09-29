import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

export const sectionGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const section = route.data['section'];

  return auth.restoreSession().pipe(
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return router.parseUrl('/login');
      }

      if (typeof section === 'string' && auth.hasSection(section)) {
        return true;
      }

      const defaultRoute = auth.getDefaultRouteForUser();
      return router.parseUrl(defaultRoute === `/${section}` ? '/unauthorized' : defaultRoute);
    })
  );
};

export const defaultRouteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.restoreSession().pipe(map(() => router.parseUrl(auth.getDefaultRouteForUser())));
};
