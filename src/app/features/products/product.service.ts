import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  EmptyProductResponse,
  ProductExportFormat,
  ProductFormValue,
  ProductListResponse,
  ProductResponse
} from './product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = `${environment.apiUrl}/products`;

  list(page: number, limit: number, search = ''): Observable<ProductListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<ProductListResponse>(this.productsUrl, { params });
  }

  get(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.productsUrl}/${id}`);
  }

  create(value: ProductFormValue, photo: File | null): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.productsUrl, this.toFormData(value, photo));
  }

  update(id: string, value: ProductFormValue, photo: File | null): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.productsUrl}/${id}`, this.toFormData(value, photo));
  }

  delete(id: string): Observable<EmptyProductResponse> {
    return this.http.delete<EmptyProductResponse>(`${this.productsUrl}/${id}`);
  }

  export(format: ProductExportFormat): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.productsUrl}/export/${format}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  photoUrl(path: string | null): string | undefined {
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path)) return path;
    const apiOrigin = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${apiOrigin}/storage/${path.replace(/^\//, '')}`;
  }

  private toFormData(value: ProductFormValue, photo: File | null): FormData {
    const data = new FormData();
    data.append('name', value.name.trim());
    data.append('brand', value.brand.trim());
    data.append('price', String(value.price));
    if (photo) data.append('photo', photo);
    return data;
  }
}
