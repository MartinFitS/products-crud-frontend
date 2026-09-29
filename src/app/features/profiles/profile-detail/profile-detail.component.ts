import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { ProfileRecord } from '../profile.models';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'app-profile-detail',
  imports: [DatePipe, RouterLink, NzButtonModule, NzDescriptionsModule, NzModalModule, NzResultModule, NzSpinModule, NzTagModule],
  templateUrl: './profile-detail.component.html',
  styleUrl: './profile-detail.component.scss'
})
export class ProfileDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly profilesApi = inject(ProfileService);
  private readonly messages = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  readonly profileId = this.route.snapshot.paramMap.get('id') ?? '';
  profile: ProfileRecord | null = null;
  isLoading = true;
  isDeleting = false;
  loadError = '';

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.loadError = '';
    this.profilesApi.get(this.profileId).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: response => this.profile = response.data,
      error: error => this.loadError = getApiErrorMessage(error, 'No fue posible cargar el perfil.')
    });
  }

  confirmDelete(): void {
    if (!this.profile) return;
    this.modal.confirm({
      nzTitle: 'Eliminar perfil',
      nzContent: `¿Deseas eliminar ${this.profile.name}? Laravel rechazará la operación si está asignado a usuarios.`,
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.deleteProfile()
    });
  }

  private deleteProfile(): Promise<void> {
    this.isDeleting = true;
    return new Promise(resolve => {
      this.profilesApi.delete(this.profileId).pipe(finalize(() => {
        this.isDeleting = false;
        resolve();
      })).subscribe({
        next: response => {
          this.messages.success(response.message);
          void this.router.navigate(['/profiles']);
        },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible eliminar el perfil. Verifica que no esté asignado.'))
      });
    });
  }
}
