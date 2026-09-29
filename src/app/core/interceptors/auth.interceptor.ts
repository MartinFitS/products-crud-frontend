import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';

const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password'
];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const isApiRequest = request.url === environment.apiUrl || request.url.startsWith(`${environment.apiUrl}/`);
  const token = store.token();
  const authorizedRequest = isApiRequest && token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      const isPublicAuthRequest = PUBLIC_AUTH_ENDPOINTS.some(endpoint => request.url.endsWith(endpoint));
      if (isApiRequest && error instanceof HttpErrorResponse && error.status === 401 && !isPublicAuthRequest) {
        store.clearSession();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
