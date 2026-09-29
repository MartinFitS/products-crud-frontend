import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';

import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { ProductExportFormat, ProductRecord } from '../product.models';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-product-list',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink, NzAvatarModule, NzButtonModule, NzInputModule, NzModalModule, NzTableModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {
  private readonly fb = inject(FormBuilder);
  readonly productsApi = inject(ProductService);
  private readonly messages = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  readonly filters = this.fb.nonNullable.group({ search: [''] });
  readonly isLoading = signal(false);
  products: ProductRecord[] = [];
  page = 1;
  limit = 10;
  total = 0;
  exportLoading: ProductExportFormat | null = null;
  deletingId: string | null = null;
  private loadSequence = 0;

  constructor() { this.loadProducts(); }

  loadProducts(page = this.page): void {
    const sequence = ++this.loadSequence;
    this.page = page;
    this.isLoading.set(true);
    this.productsApi.list(this.page, this.limit, this.filters.controls.search.value).pipe(
      finalize(() => { if (sequence === this.loadSequence) this.isLoading.set(false); })
    ).subscribe({
      next: response => {
        this.products = response.data ?? [];
        this.page = response.meta.page;
        this.limit = response.meta.limit;
        this.total = response.meta.total;
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible cargar los productos.'))
    });
  }

  search(): void { this.loadProducts(1); }

  clearSearch(): void {
    this.filters.reset({ search: '' });
    this.loadProducts(1);
  }

  pageChanged(page: number): void { if (page !== this.page) this.loadProducts(page); }

  pageSizeChanged(size: number): void {
    if (size === this.limit) return;
    this.limit = size;
    this.loadProducts(1);
  }

  confirmDelete(product: ProductRecord): void {
    this.modal.confirm({
      nzTitle: 'Eliminar producto',
      nzContent: `¿Deseas eliminar permanentemente ${product.name} (${product.code})?`,
      nzOkText: 'Eliminar', nzOkDanger: true, nzCancelText: 'Cancelar',
      nzOnOk: () => this.deleteProduct(product)
    });
  }

  download(format: ProductExportFormat): void {
    if (this.exportLoading) return;
    this.exportLoading = format;
    this.productsApi.export(format).pipe(finalize(() => this.exportLoading = null)).subscribe({
      next: response => {
        this.saveDownload(response, format);
        this.messages.success(`Exportación ${format === 'pdf' ? 'PDF' : 'Excel'} descargada.`);
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible generar la exportación.'))
    });
  }

  private deleteProduct(product: ProductRecord): Promise<void> {
    this.deletingId = product.id;
    return new Promise(resolve => {
      this.productsApi.delete(product.id).pipe(finalize(() => { this.deletingId = null; resolve(); })).subscribe({
        next: response => {
          this.messages.success(response.message);
          this.loadProducts(this.products.length === 1 && this.page > 1 ? this.page - 1 : this.page);
        },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible eliminar el producto.'))
      });
    });
  }

  private saveDownload(response: HttpResponse<Blob>, format: ProductExportFormat): void {
    if (!response.body) return;
    const disposition = response.headers.get('content-disposition') ?? '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const filename = encodedName ? decodeURIComponent(encodedName) : plainName ?? `products.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const url = URL.createObjectURL(response.body);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
