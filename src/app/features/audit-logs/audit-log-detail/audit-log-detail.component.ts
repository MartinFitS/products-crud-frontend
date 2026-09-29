import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { AuditAction, AuditLogRecord, AuditableType } from '../audit-log.models';
import { AuditLogService } from '../audit-log.service';

@Component({
  selector: 'app-audit-log-detail',
  imports: [DatePipe, RouterLink, NzButtonModule, NzDescriptionsModule, NzResultModule, NzSpinModule, NzTableModule, NzTagModule],
  templateUrl: './audit-log-detail.component.html',
  styleUrl: './audit-log-detail.component.scss'
})
export class AuditLogDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auditApi = inject(AuditLogService);
  readonly entryId = this.route.snapshot.paramMap.get('id') ?? '';
  entry: AuditLogRecord | null = null;
  isLoading = true;
  loadError = '';

  constructor() { this.loadEntry(); }

  loadEntry(): void {
    this.isLoading = true;
    this.loadError = '';
    this.auditApi.get(this.entryId).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: response => this.entry = response.data,
      error: error => this.loadError = getApiErrorMessage(error, 'No fue posible cargar el registro de bitácora.')
    });
  }

  changeKeys(entry: AuditLogRecord): string[] {
    return [...new Set([...Object.keys(entry.old_values ?? {}), ...Object.keys(entry.new_values ?? {})])];
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

  fieldLabel(field: string): string {
    const labels: Record<string, string> = {
      code: 'Código', name: 'Nombre', email: 'Correo', phone: 'Teléfono', photo: 'Fotografía',
      brand: 'Marca', price: 'Precio', is_active: 'Estado', profile_ids: 'Perfiles', sections: 'Secciones'
    };
    return labels[field] ?? field.replaceAll('_', ' ');
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Activo' : 'Inactivo';
    if (Array.isArray(value)) return value.length ? value.map(item => this.formatValue(item)).join(', ') : '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
