import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { ProductRecord } from '../product.models';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-product-detail',
  imports: [DatePipe, DecimalPipe, RouterLink, NzButtonModule, NzDescriptionsModule, NzImageModule, NzModalModule, NzResultModule, NzSpinModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly productsApi = inject(ProductService);
  private readonly messages = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  readonly productId = this.route.snapshot.paramMap.get('id') ?? '';
  product: ProductRecord | null = null;
  isLoading = true;
  isDeleting = false;
  loadError = '';

  constructor() { this.loadProduct(); }

  loadProduct(): void {
    this.isLoading = true;
    this.loadError = '';
    this.productsApi.get(this.productId).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: response => this.product = response.data,
      error: error => this.loadError = getApiErrorMessage(error, 'No fue posible cargar el producto.')
    });
  }

  confirmDelete(): void {
    if (!this.product) return;
    this.modal.confirm({
      nzTitle: 'Eliminar producto',
      nzContent: `¿Deseas eliminar permanentemente ${this.product.name} (${this.product.code})? También se eliminará su fotografía.`,
      nzOkText: 'Eliminar', nzOkDanger: true, nzCancelText: 'Cancelar',
      nzOnOk: () => this.deleteProduct()
    });
  }

  private deleteProduct(): Promise<void> {
    this.isDeleting = true;
    return new Promise(resolve => {
      this.productsApi.delete(this.productId).pipe(finalize(() => { this.isDeleting = false; resolve(); })).subscribe({
        next: response => { this.messages.success(response.message); void this.router.navigate(['/products']); },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible eliminar el producto.'))
      });
    });
  }
}
