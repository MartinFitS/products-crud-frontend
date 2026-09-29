import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  EmptyProfileResponse,
  ProfileExportFormat,
  ProfileFormValue,
  ProfileListResponse,
  ProfileResponse,
  SectionListResponse,
  SectionResponse
} from './profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly profilesUrl = `${environment.apiUrl}/profiles`;
  private readonly sectionsUrl = `${environment.apiUrl}/sections`;

  list(page: number, limit: number, search = ''): Observable<ProfileListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<ProfileListResponse>(this.profilesUrl, { params });
  }

  get(id: string): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.profilesUrl}/${id}`);
  }

  create(value: ProfileFormValue): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(this.profilesUrl, value);
  }

  update(id: string, value: ProfileFormValue): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.profilesUrl}/${id}`, value);
  }

  delete(id: string): Observable<EmptyProfileResponse> {
    return this.http.delete<EmptyProfileResponse>(`${this.profilesUrl}/${id}`);
  }

  export(format: ProfileExportFormat): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.profilesUrl}/export/${format}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  listSections(): Observable<SectionListResponse> {
    return this.http.get<SectionListResponse>(this.sectionsUrl);
  }

  createSection(name: string, slug: string): Observable<SectionResponse> {
    const body = slug.trim() ? { name: name.trim(), slug: slug.trim() } : { name: name.trim() };
    return this.http.post<SectionResponse>(this.sectionsUrl, body);
  }

  deleteSection(id: string): Observable<EmptyProfileResponse> {
    return this.http.delete<EmptyProfileResponse>(`${this.sectionsUrl}/${id}`);
  }
}
