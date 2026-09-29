import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MeResponse,
  MessageResponse,
  ResetPasswordRequest
} from './auth.models';
import { AuthStore } from './auth.store';

const SECTION_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['products', '/products'],
  ['users', '/users'],
  ['profiles', '/profiles'],
  ['audit-logs', '/audit-logs']
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly store = inject(AuthStore);
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private restoreRequest$: Observable<boolean> | null = null;

  readonly currentUser = this.store.currentUser;
  readonly isAuthenticated = this.store.isAuthenticated;
  readonly isInitialized = this.store.isInitialized;
  readonly isLoading = this.store.isLoading;
  readonly sections = this.store.sections;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.store.setLoading(true);
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap(response => this.store.setSession(response.data.token, response.data.user)),
      finalize(() => this.store.setLoading(false))
    );
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.authUrl}/me`).pipe(
      tap(response => this.store.setUser(response.data))
    );
  }

  restoreSession(): Observable<boolean> {
    if (this.store.isInitialized()) {
      return of(this.store.isAuthenticated());
    }

    if (!this.store.token()) {
      this.store.markInitialized();
      return of(false);
    }

    if (!this.restoreRequest$) {
      this.store.setLoading(true);
      this.restoreRequest$ = this.me().pipe(
        map(() => true),
        catchError(() => {
          this.store.clearSession();
          return of(false);
        }),
        finalize(() => {
          this.store.markInitialized();
          this.store.setLoading(false);
          this.restoreRequest$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.restoreRequest$;
  }

  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.authUrl}/logout`, {}).pipe(
      catchError(() => of({ success: true, message: 'Sesión local cerrada.', data: null })),
      finalize(() => this.store.clearSession())
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.authUrl}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.authUrl}/reset-password`, payload);
  }

  clearSession(): void {
    this.store.clearSession();
  }

  hasSection(section: string): boolean {
    return this.store.sections().includes(section);
  }

  getDefaultRouteForUser(): string {
    return SECTION_ROUTES.find(([section]) => this.hasSection(section))?.[1] ?? '/unauthorized';
  }
}
