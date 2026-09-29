import { DatePipe } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { ProfileExportFormat, ProfileRecord } from '../profile.models';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'app-profile-list',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, NzButtonModule, NzInputModule, NzModalModule, NzTableModule, NzTagModule],
  templateUrl: './profile-list.component.html',
  styleUrl: './profile-list.component.scss'
})
export class ProfileListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profilesApi = inject(ProfileService);
  private readonly messages = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  readonly filters = this.fb.nonNullable.group({ search: [''] });
  readonly isLoading = signal(false);
  profiles: ProfileRecord[] = [];
  page = 1;
  limit = 10;
  total = 0;
  exportLoading: ProfileExportFormat | null = null;
  deletingId: string | null = null;
  private loadSequence = 0;

  constructor() {
    this.loadProfiles();
  }

  loadProfiles(page = this.page): void {
    const sequence = ++this.loadSequence;
    this.page = page;
    this.isLoading.set(true);
    this.profilesApi.list(this.page, this.limit, this.filters.controls.search.value).pipe(
      finalize(() => {
        if (sequence === this.loadSequence) this.isLoading.set(false);
      })
    ).subscribe({
      next: response => {
        this.profiles = response.data;
        this.page = response.meta.page;
        this.limit = response.meta.limit;
        this.total = response.meta.total;
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible cargar los perfiles.'))
    });
  }

  search(): void {
    this.loadProfiles(1);
  }

  clearSearch(): void {
    this.filters.reset({ search: '' });
    this.loadProfiles(1);
  }

  pageChanged(page: number): void {
    if (page !== this.page) this.loadProfiles(page);
  }

  pageSizeChanged(size: number): void {
    if (size === this.limit) return;
    this.limit = size;
    this.loadProfiles(1);
  }

  confirmDelete(profile: ProfileRecord): void {
    this.modal.confirm({
      nzTitle: 'Eliminar perfil',
      nzContent: `¿Deseas eliminar permanentemente el perfil ${profile.name}? Solo es posible si no está asignado a usuarios.`,
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.deleteProfile(profile)
    });
  }

  download(format: ProfileExportFormat): void {
    if (this.exportLoading) return;
    this.exportLoading = format;
    this.profilesApi.export(format).pipe(finalize(() => this.exportLoading = null)).subscribe({
      next: response => {
        this.saveDownload(response, format);
        this.messages.success(`Exportación ${format === 'pdf' ? 'PDF' : 'Excel'} descargada.`);
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible generar la exportación.'))
    });
  }

  private deleteProfile(profile: ProfileRecord): Promise<void> {
    this.deletingId = profile.id;
    return new Promise(resolve => {
      this.profilesApi.delete(profile.id).pipe(finalize(() => {
        this.deletingId = null;
        resolve();
      })).subscribe({
        next: response => {
          this.messages.success(response.message);
          const nextPage = this.profiles.length === 1 && this.page > 1 ? this.page - 1 : this.page;
          this.loadProfiles(nextPage);
        },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible eliminar el perfil. Verifica que no esté asignado.'))
      });
    });
  }

  private saveDownload(response: HttpResponse<Blob>, format: ProfileExportFormat): void {
    if (!response.body) return;
    const disposition = response.headers.get('content-disposition') ?? '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const filename = encodedName
      ? decodeURIComponent(encodedName)
      : plainName ?? `profiles.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const url = URL.createObjectURL(response.body);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
