import { DatePipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { AuthService } from '../../../core/auth/auth.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { UserExportFormat, UserRecord } from '../user.models';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-list',
  imports: [
    DatePipe, ReactiveFormsModule, RouterLink, NzAvatarModule, NzButtonModule, NzInputModule,
    NzModalModule, NzSelectModule, NzTableModule, NzTagModule, NzToolTipModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  readonly filters = this.fb.nonNullable.group({ search: [''], status: ['all'] });
  readonly statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ];
  users: UserRecord[] = [];
  page = 1;
  limit = 10;
  total = 0;
  readonly isLoading = signal(false);
  exportLoading: UserExportFormat | null = null;
  statusLoadingId: string | null = null;
  deletingId: string | null = null;
  private loadSequence = 0;

  constructor() {
    this.loadUsers();
  }

  loadUsers(page = this.page): void {
    const sequence = ++this.loadSequence;
    this.page = page;
    const { search, status } = this.filters.getRawValue();
    this.isLoading.set(true);
    this.usersApi.list({
      page: this.page,
      limit: this.limit,
      search,
      is_active: status === 'all' ? undefined : status === 'active'
    }).pipe(finalize(() => {
      if (sequence === this.loadSequence) this.isLoading.set(false);
    })).subscribe({
      next: response => {
        this.users = response.data;
        this.total = response.meta.total;
        this.page = response.meta.page;
        this.limit = response.meta.limit;
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible cargar los usuarios.'))
    });
  }

  search(): void {
    this.loadUsers(1);
  }

  clearFilters(): void {
    this.filters.reset({ search: '', status: 'all' });
    this.loadUsers(1);
  }

  changePageSize(size: number): void {
    this.limit = size;
    this.loadUsers(1);
  }

  pageChanged(page: number): void {
    if (page !== this.page) this.loadUsers(page);
  }

  pageSizeChanged(size: number): void {
    if (size !== this.limit) this.changePageSize(size);
  }

  confirmStatus(user: UserRecord): void {
    const nextStatus = !user.is_active;
    this.modal.confirm({
      nzTitle: `${nextStatus ? 'Activar' : 'Desactivar'} usuario`,
      nzContent: nextStatus
        ? `¿Deseas activar a ${user.name}?`
        : `¿Deseas desactivar a ${user.name}? Sus sesiones activas serán revocadas.`,
      nzOkText: nextStatus ? 'Activar' : 'Desactivar',
      nzOkDanger: !nextStatus,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.changeStatus(user, nextStatus)
    });
  }

  confirmDelete(user: UserRecord): void {
    this.modal.confirm({
      nzTitle: 'Eliminar usuario',
      nzContent: `Esta acción eliminará permanentemente a ${user.name}, su foto y sus sesiones.`,
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.deleteUser(user)
    });
  }

  download(format: UserExportFormat): void {
    if (this.exportLoading) return;
    this.exportLoading = format;
    this.usersApi.export(format).pipe(finalize(() => this.exportLoading = null)).subscribe({
      next: response => {
        this.saveDownload(response, format);
        this.messages.success(`Exportación ${format === 'pdf' ? 'PDF' : 'Excel'} descargada.`);
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible generar la exportación.'))
    });
  }

  initials(user: UserRecord): string {
    return user.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  photoUrl(user: UserRecord): string | undefined {
    return this.usersApi.photoUrl(user.photo);
  }

  private changeStatus(user: UserRecord, isActive: boolean): Promise<void> {
    this.statusLoadingId = user.id;
    return new Promise(resolve => {
      this.usersApi.updateStatus(user.id, isActive).pipe(
        finalize(() => {
          this.statusLoadingId = null;
          resolve();
        })
      ).subscribe({
        next: response => {
          this.messages.success(response.message);
          if (user.id === this.auth.currentUser()?.id && !isActive) {
            this.auth.clearSession();
            void this.router.navigate(['/login']);
            return;
          }
          this.loadUsers();
        },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible actualizar el estado.'))
      });
    });
  }

  private deleteUser(user: UserRecord): Promise<void> {
    this.deletingId = user.id;
    return new Promise(resolve => {
      this.usersApi.delete(user.id).pipe(
        finalize(() => {
          this.deletingId = null;
          resolve();
        })
      ).subscribe({
        next: response => {
          this.messages.success(response.message);
          if (user.id === this.auth.currentUser()?.id) {
            this.auth.clearSession();
            void this.router.navigate(['/login']);
            return;
          }
          const nextPage = this.users.length === 1 && this.page > 1 ? this.page - 1 : this.page;
          this.loadUsers(nextPage);
        },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible eliminar el usuario.'))
      });
    });
  }

  private saveDownload(response: HttpResponse<Blob>, format: UserExportFormat): void {
    if (!response.body) return;
    const disposition = response.headers.get('content-disposition') ?? '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const filename = encodedName
      ? decodeURIComponent(encodedName)
      : plainName ?? `users.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const url = URL.createObjectURL(response.body);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
