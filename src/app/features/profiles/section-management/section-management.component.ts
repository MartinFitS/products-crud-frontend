import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { SectionRecord } from '../profile.models';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'app-section-management',
  imports: [
    ReactiveFormsModule, RouterLink, NzAlertModule, NzButtonModule, NzCardModule, NzFormModule,
    NzInputModule, NzModalModule, NzTableModule, NzTagModule
  ],
  templateUrl: './section-management.component.html',
  styleUrl: './section-management.component.scss'
})
export class SectionManagementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profilesApi = inject(ProfileService);
  private readonly messages = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.maxLength(100), Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]]
  });
  sections: SectionRecord[] = [];
  isLoading = true;
  isSubmitting = false;
  deletingId: string | null = null;

  constructor() {
    this.loadSections();
  }

  loadSections(): void {
    this.isLoading = true;
    this.profilesApi.listSections().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: response => this.sections = response.data,
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible cargar las secciones.'))
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, slug } = this.form.getRawValue();
    this.isSubmitting = true;
    this.profilesApi.createSection(name, slug).pipe(finalize(() => this.isSubmitting = false)).subscribe({
      next: response => {
        this.messages.success(response.message);
        this.form.reset({ name: '', slug: '' });
        this.loadSections();
      },
      error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible crear la sección.'))
    });
  }

  confirmDelete(section: SectionRecord): void {
    this.modal.confirm({
      nzTitle: 'Eliminar sección',
      nzContent: `¿Deseas eliminar ${section.name}? Solo es posible si no pertenece al sistema ni está asignada a perfiles.`,
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.deleteSection(section)
    });
  }

  private deleteSection(section: SectionRecord): Promise<void> {
    this.deletingId = section.id;
    return new Promise(resolve => {
      this.profilesApi.deleteSection(section.id).pipe(finalize(() => {
        this.deletingId = null;
        resolve();
      })).subscribe({
        next: response => {
          this.messages.success(response.message);
          this.loadSections();
        },
        error: error => this.messages.error(getApiErrorMessage(error, 'No fue posible eliminar la sección. Verifica que no esté asignada.'))
      });
    });
  }
}
