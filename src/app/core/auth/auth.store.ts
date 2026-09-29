import { computed, Injectable, signal } from '@angular/core';

import { AuthUser } from './auth.models';

export const AUTH_TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly userState = signal<AuthUser | null>(null);
  private readonly tokenState = signal<string | null>(localStorage.getItem(AUTH_TOKEN_KEY));
  private readonly initializedState = signal(false);
  private readonly loadingState = signal(false);

  readonly currentUser = this.userState.asReadonly();
  readonly token = this.tokenState.asReadonly();
  readonly isInitialized = this.initializedState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenState() && this.userState()));
  readonly sections = computed(() => {
    const profiles = this.userState()?.profiles ?? [];
    return [...new Set(profiles.flatMap(profile => profile.sections ?? []))];
  });

  setSession(token: string, user: AuthUser): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    this.tokenState.set(token);
    this.userState.set(user);
    this.initializedState.set(true);
  }

  setUser(user: AuthUser): void {
    this.userState.set(user);
  }

  setLoading(isLoading: boolean): void {
    this.loadingState.set(isLoading);
  }

  markInitialized(): void {
    this.initializedState.set(true);
  }

  clearSession(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    this.tokenState.set(null);
    this.userState.set(null);
    this.initializedState.set(true);
    this.loadingState.set(false);
  }
}
