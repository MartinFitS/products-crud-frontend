import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  EmptyUserResponse,
  ProfileListResponse,
  ProfileOption,
  UserExportFormat,
  UserFormValue,
  UserListResponse,
  UserQuery,
  UserRecord,
  UserResponse
} from './user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiUrl}/users`;

  list(query: UserQuery): Observable<UserListResponse> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit);

    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.is_active !== undefined) params = params.set('is_active', query.is_active);

    return this.http.get<UserListResponse>(this.usersUrl, { params }).pipe(
      map(response => ({
        ...response,
        data: response.data.map(user => this.normalizeUser(user))
      }))
    );
  }

  get(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.usersUrl}/${id}`).pipe(map(response => this.normalizeResponse(response)));
  }

  create(value: UserFormValue, photo: File): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.usersUrl, this.toFormData(value, photo)).pipe(map(response => this.normalizeResponse(response)));
  }

  update(id: string, value: UserFormValue, photo: File | null): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.usersUrl}/${id}`, this.toFormData(value, photo)).pipe(map(response => this.normalizeResponse(response)));
  }

  updateStatus(id: string, isActive: boolean): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.usersUrl}/${id}/status`, { is_active: isActive }).pipe(
      map(response => this.normalizeResponse(response))
    );
  }

  delete(id: string): Observable<EmptyUserResponse> {
    return this.http.delete<EmptyUserResponse>(`${this.usersUrl}/${id}`);
  }

  export(format: UserExportFormat): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.usersUrl}/export/${format}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  listProfiles(): Observable<ProfileOption[]> {
    const params = new HttpParams().set('page', 1).set('limit', 100);
    return this.http.get<ProfileListResponse>(`${environment.apiUrl}/profiles`, { params }).pipe(
      map(response => response.data)
    );
  }

  photoUrl(path: string | null): string | undefined {
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path)) return path;
    const apiRoot = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${apiRoot}/storage/${path.replace(/^\//, '')}`;
  }

  private toFormData(value: UserFormValue, photo: File | null): FormData {
    const data = new FormData();
    data.append('name', value.name.trim());
    data.append('email', value.email.trim().toLowerCase());

    if (value.phone.trim()) data.append('phone', value.phone.trim());
    if (value.password) {
      data.append('password', value.password);
      data.append('password_confirmation', value.password_confirmation);
    }
    if (photo) data.append('photo', photo, photo.name);
    value.profile_ids.forEach(id => data.append('profile_ids[]', id));

    return data;
  }

  private normalizeResponse(response: UserResponse): UserResponse {
    return { ...response, data: this.normalizeUser(response.data) };
  }

  private normalizeUser(user: UserRecord): UserRecord {
    return {
      ...user,
      profile_ids: user.profile_ids ?? [],
      profiles: user.profiles ?? []
    };
  }
}
