import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { AuthService } from '../../../core/auth/auth.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { UserRecord } from '../user.models';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-detail',
  imports: [
    DatePipe, RouterLink, NzAvatarModule, NzButtonModule, NzDescriptionsModule, NzModalModule,
    NzResultModule, NzSpinModule, NzTagModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  user: UserRecord | null = null;
  isLoading = true;
  actionLoading = false;
  loadError = '';

  constructor() {
    this.loadUser();
  }

  loadUser(): void {
    this.isLoading = true;
    this.loadError = '';
    this.usersApi.get(this.userId).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: response => this.user = response.data,
      error: error => this.loadError = getApiErrorMessage(error, 'No fue posible cargar el usuario.')
    });
  }

  confirmStatus(): void {
    if (!this.user) return;
    const nextStatus = !this.user.is_active;
    this.modal.confirm({
      nzTitle: `${nextStatus ? 'Activar' : 'Desactivar'} usuario`,
      nzContent: nextStatus
        ? `¿Deseas activar a ${this.user.name}?`
        : 'Al desactivar la cuenta se revocarán todas sus sesiones.',
      nzOkText: nextStatus ? 'Activar' : 'Desactivar',
      nzOkDanger: !nextStatus,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.changeStatus(nextStatus)
    });
  }

  confirmDelete(): void {
    if (!this.user) return;
    this.modal.confirm({
      nzTitle: 'Eliminar usuario permanentemente',
      nzContent: `Se eliminará a ${this.user.name}, su fotografía y todas sus sesiones.`,
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.deleteUser()
    });
  }

  photoUrl(): string | undefined {
    return this.usersApi.photoUrl(this.user?.photo ?? null);
  }

  initials(): string {
    return this.user?.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() ?? '';
  }

  private changeStatus(isActive: boolean): Promise<void> {
    if (!this.user) return Promise.resolve();
    this.actionLoading = true;
    return new Promise(resolve => {
      this.usersApi.updateStatus(this.userId, isActive).pipe(finalize(() => {
        this.actionLoading = false;
        resolve();
      })).subscribe({
        next: response => {
          this.user = response.data;
          this.messages.success(response.message);
          if (!isActive && this.userId === this.auth.currentUser()?.id) {
            this.auth.clearSession();
            void this.router.navigate(['/login']);
          }
        },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible actualizar el estado.'))
      });
    });
  }

  private deleteUser(): Promise<void> {
    this.actionLoading = true;
    return new Promise(resolve => {
      this.usersApi.delete(this.userId).pipe(finalize(() => {
        this.actionLoading = false;
        resolve();
      })).subscribe({
        next: response => {
          this.messages.success(response.message);
          if (this.userId === this.auth.currentUser()?.id) {
            this.auth.clearSession();
            void this.router.navigate(['/login']);
          } else {
            void this.router.navigate(['/users']);
          }
        },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible eliminar el usuario.'))
      });
    });
  }
}
