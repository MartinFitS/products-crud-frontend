import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ProductListResponse, ProductRecord } from './product.models';
import { ProductService } from './product.service';

const product: ProductRecord = {
  id: 'product-1', code: 'PRD-000001', name: 'Laptop', brand: 'Acme', price: 899.5, photo: 'products/PRD-000001/photo.webp'
};

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista productos con búsqueda y paginación', () => {
    const response: ProductListResponse = { success: true, message: 'OK', data: [product], meta: { page: 2, limit: 20, total: 21 } };
    service.list(2, 20, 'acme').subscribe(result => expect(result).toEqual(response));
    const request = http.expectOne(req => req.url === `${environment.apiUrl}/products`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('search')).toBe('acme');
    request.flush(response);
  });

  it('crea un producto como multipart con foto opcional', () => {
    const photo = new File(['image'], 'product.webp', { type: 'image/webp' });
    service.create({ name: product.name, brand: product.brand, price: product.price }, photo).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/products`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    expect((request.request.body as FormData).get('name')).toBe(product.name);
    expect((request.request.body as FormData).get('brand')).toBe(product.brand);
    expect((request.request.body as FormData).get('price')).toBe(String(product.price));
    expect((request.request.body as FormData).get('photo')).toBe(photo);
    request.flush({ success: true, message: 'Creado', data: product });
  });

  it('consulta y actualiza por el endpoint multipart compatible', () => {
    service.get(product.id).subscribe();
    http.expectOne(`${environment.apiUrl}/products/${product.id}`).flush({ success: true, message: 'OK', data: product });

    service.update(product.id, { name: 'Laptop Pro', brand: 'Acme', price: 999.99 }, null).subscribe();
    const update = http.expectOne(`${environment.apiUrl}/products/${product.id}`);
    expect(update.request.method).toBe('POST');
    expect((update.request.body as FormData).get('name')).toBe('Laptop Pro');
    expect((update.request.body as FormData).has('photo')).toBeFalse();
    update.flush({ success: true, message: 'Actualizado', data: { ...product, name: 'Laptop Pro' } });
  });

  it('elimina y exporta productos', () => {
    service.delete(product.id).subscribe();
    const deletion = http.expectOne(`${environment.apiUrl}/products/${product.id}`);
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ success: true, message: 'Eliminado', data: null });

    service.export('pdf').subscribe();
    const exportRequest = http.expectOne(`${environment.apiUrl}/products/export/pdf`);
    expect(exportRequest.request.responseType).toBe('blob');
    exportRequest.flush(new Blob(['pdf']));
  });

  it('resuelve fotografías locales y conserva URLs absolutas', () => {
    expect(service.photoUrl(product.photo)).toBe('http://127.0.0.1:8000/storage/products/PRD-000001/photo.webp');
    expect(service.photoUrl('https://cdn.example.com/product.webp')).toBe('https://cdn.example.com/product.webp');
    expect(service.photoUrl(null)).toBeUndefined();
  });
});
