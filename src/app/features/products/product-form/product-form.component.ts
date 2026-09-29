import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { ApiErrorResponse } from '../../../core/auth/auth.models';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { ProductFormValue, ProductRecord } from '../product.models';
import { ProductService } from '../product.service';

const maxDecimals = (places: number): ValidatorFn => (control: AbstractControl): ValidationErrors | null => {
  if (control.value === null || control.value === undefined || control.value === '') return null;
  const value = String(control.value);
  const decimals = value.includes('.') ? value.split('.')[1].length : 0;
  return decimals <= places ? null : { maxDecimals: { places } };
};

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, NzAvatarModule, NzButtonModule, NzCardModule, NzFormModule, NzInputModule, NzSpinModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly productsApi = inject(ProductService);
  private readonly messages = inject(NzMessageService);
  private previewObjectUrl: string | null = null;

  readonly productId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = Boolean(this.productId);
  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    brand: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(999.99), maxDecimals(2)])
  });

  product: ProductRecord | null = null;
  photoFile: File | null = null;
  photoPreview: string | undefined;
  photoError = '';
  serverErrors: Record<string, string[]> = {};
  isLoading = this.isEdit;
  isSubmitting = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePhotoPreview());
    this.loadProduct();
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.photoError = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError = 'Selecciona una imagen JPEG, PNG o WEBP.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = 'La imagen no puede superar 5 MB.';
      input.value = '';
      return;
    }
    this.revokePhotoPreview();
    this.photoFile = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.photoPreview = this.previewObjectUrl;
  }

  submit(): void {
    this.serverErrors = {};
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }
    const rawValue = this.form.getRawValue();
    const value: ProductFormValue = { name: rawValue.name, brand: rawValue.brand, price: Number(rawValue.price) };
    this.isSubmitting = true;
    const request$ = this.isEdit && this.productId
      ? this.productsApi.update(this.productId, value, this.photoFile)
      : this.productsApi.create(value, this.photoFile);

    request$.pipe(finalize(() => this.isSubmitting = false)).subscribe({
      next: response => {
        this.messages.success(response.message);
        const destination = this.isEdit ? ['/products', response.data.id] : ['/products'];
        void this.router.navigate(destination);
      },
      error: error => {
        this.captureServerErrors(error);
        this.messages.error(getApiErrorMessage(error, `No fue posible ${this.isEdit ? 'actualizar' : 'crear'} el producto.`));
      }
    });
  }

  fieldServerError(field: string): string | null { return this.serverErrors[field]?.[0] ?? null; }

  private loadProduct(): void {
    if (!this.isEdit || !this.productId) {
      this.isLoading = false;
      return;
    }
    this.productsApi.get(this.productId).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: response => {
        const product = response.data;
        this.product = product;
        this.form.patchValue({ name: product.name, brand: product.brand, price: product.price });
        this.photoPreview = this.productsApi.photoUrl(product.photo);
      },
      error: error => {
        this.messages.error(getApiErrorMessage(error, 'No fue posible cargar el producto.'));
        void this.router.navigate(['/products']);
      }
    });
  }

  private captureServerErrors(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) return;
    this.serverErrors = (error.error as ApiErrorResponse | null)?.errors ?? {};
    for (const field of Object.keys(this.serverErrors)) {
      if (field === 'name' || field === 'brand' || field === 'price') this.form.controls[field].setErrors({ server: true });
    }
    if (this.serverErrors['photo']?.[0]) this.photoError = this.serverErrors['photo'][0];
  }

  private revokePhotoPreview(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }
}
