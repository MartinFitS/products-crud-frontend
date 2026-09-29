import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { ApiErrorResponse } from '../../../core/auth/auth.models';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { ProfileFormValue, SectionRecord } from '../profile.models';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'app-profile-form',
  imports: [
    ReactiveFormsModule, RouterLink, NzAlertModule, NzButtonModule, NzCardModule, NzFormModule,
    NzInputModule, NzSelectModule, NzSpinModule, NzTagModule
  ],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.scss'
})
export class ProfileFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly profilesApi = inject(ProfileService);
  private readonly messages = inject(NzMessageService);

  readonly profileId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = Boolean(this.profileId);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    sections: [[] as string[], [Validators.required, Validators.minLength(1), Validators.maxLength(20)]]
  });
  sections: SectionRecord[] = [];
  serverErrors: Record<string, string[]> = {};
  isLoading = true;
  isSubmitting = false;
  loadError = '';

  constructor() {
    this.loadData();
  }

  submit(): void {
    this.serverErrors = {};
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.form.getRawValue() as ProfileFormValue;
    const request$ = this.isEdit && this.profileId
      ? this.profilesApi.update(this.profileId, value)
      : this.profilesApi.create(value);

    request$.pipe(finalize(() => this.isSubmitting = false)).subscribe({
      next: response => {
        this.messages.success(response.message);
        void this.router.navigate(['/profiles', response.data.id]);
      },
      error: error => {
        this.captureServerErrors(error);
        this.messages.error(getApiErrorMessage(error, `No fue posible ${this.isEdit ? 'actualizar' : 'crear'} el perfil.`));
      }
    });
  }

  fieldServerError(field: string): string | null {
    const direct = this.serverErrors[field]?.[0];
    if (direct) return direct;
    const nested = Object.keys(this.serverErrors).find(key => key.startsWith(`${field}.`));
    return nested ? this.serverErrors[nested][0] : null;
  }

  private loadData(): void {
    const profile$ = this.isEdit && this.profileId ? this.profilesApi.get(this.profileId) : of(null);
    forkJoin({ sectionsResponse: this.profilesApi.listSections(), profileResponse: profile$ }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ sectionsResponse, profileResponse }) => {
        this.sections = sectionsResponse.data;
        if (profileResponse) {
          this.form.setValue({
            name: profileResponse.data.name,
            sections: profileResponse.data.sections
          });
        }
      },
      error: error => {
        this.loadError = getApiErrorMessage(error, 'No fue posible cargar las secciones disponibles.');
        this.messages.error(this.loadError);
      }
    });
  }

  private captureServerErrors(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) return;
    const body = error.error as ApiErrorResponse | null;
    this.serverErrors = body?.errors ?? {};
    for (const key of Object.keys(this.serverErrors)) {
      const controlName = key.split('.')[0] as keyof ProfileFormValue;
      this.form.controls[controlName]?.setErrors({ server: true });
    }
  }
}
