import { DatePipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { AuditAction, AuditExportFormat, AuditLogFilters, AuditLogRecord, AuditableType } from '../audit-log.models';
import { AuditLogService } from '../audit-log.service';

@Component({
  selector: 'app-audit-log-list',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, NzButtonModule, NzInputModule, NzSelectModule, NzTableModule, NzTagModule],
  templateUrl: './audit-log-list.component.html',
  styleUrl: './audit-log-list.component.scss'
})
export class AuditLogListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auditApi = inject(AuditLogService);
  private readonly messages = inject(NzMessageService);

  readonly filters = this.fb.nonNullable.group({
    search: [''], action: ['' as AuditAction | ''], auditable_type: ['' as AuditableType | ''], date_from: [''], date_to: ['']
  });
  readonly isLoading = signal(false);
  entries: AuditLogRecord[] = [];
  page = 1;
  limit = 10;
  total = 0;
  exportLoading: AuditExportFormat | null = null;
  private loadSequence = 0;

  constructor() { this.loadEntries(); }

  loadEntries(page = this.page): void {
    const sequence = ++this.loadSequence;
    this.page = page;
    this.isLoading.set(true);
    this.auditApi.list(page, this.limit, this.currentFilters()).pipe(
      finalize(() => { if (sequence === this.loadSequence) this.isLoading.set(false); })
    ).subscribe({
      next: response => {
        this.entries = response.data ?? [];
        this.page = response.meta.page;
        this.limit = response.meta.limit;
        this.total = response.meta.total;
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible cargar la bitácora.'))
    });
  }

  search(): void { this.loadEntries(1); }

  clearFilters(): void {
    this.filters.reset({ search: '', action: '', auditable_type: '', date_from: '', date_to: '' });
    this.loadEntries(1);
  }

  pageChanged(page: number): void { if (page !== this.page) this.loadEntries(page); }

  pageSizeChanged(size: number): void {
    if (size === this.limit) return;
    this.limit = size;
    this.loadEntries(1);
  }

  download(format: AuditExportFormat): void {
    if (this.exportLoading) return;
    this.exportLoading = format;
    this.auditApi.export(format, this.currentFilters()).pipe(finalize(() => this.exportLoading = null)).subscribe({
      next: response => {
        this.saveDownload(response, format);
        this.messages.success(`Exportación ${format === 'pdf' ? 'PDF' : 'Excel'} descargada.`);
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible exportar la bitácora.'))
    });
  }

  actionLabel(action: AuditAction): string {
    return { created: 'Creación', updated: 'Actualización', status_updated: 'Cambio de estado', deleted: 'Eliminación' }[action];
  }

  actionColor(action: AuditAction): string {
    return { created: 'green', updated: 'blue', status_updated: 'gold', deleted: 'red' }[action];
  }

  typeLabel(type: AuditableType): string {
    return { product: 'Producto', user: 'Usuario', profile: 'Perfil' }[type];
  }

  targetLabel(entry: AuditLogRecord): string {
    const values = entry.new_values ?? entry.old_values;
    const code = typeof values?.['code'] === 'string' ? values['code'] : '';
    const name = typeof values?.['name'] === 'string' ? values['name'] : '';
    return [code, name].filter(Boolean).join(' · ') || entry.auditable_id;
  }

  private currentFilters(): AuditLogFilters { return this.filters.getRawValue(); }

  private saveDownload(response: HttpResponse<Blob>, format: AuditExportFormat): void {
    if (!response.body) return;
    const disposition = response.headers.get('content-disposition') ?? '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const filename = encodedName ? decodeURIComponent(encodedName) : plainName ?? `audit-logs.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const url = URL.createObjectURL(response.body);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
