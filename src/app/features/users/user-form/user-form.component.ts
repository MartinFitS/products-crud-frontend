import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { ApiErrorResponse } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { ProfileOption, UserFormValue, UserRecord } from '../user.models';
import { UserService } from '../user.service';

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const E164_PHONE = /^\+[1-9]\d{7,14}$/;

const passwordsMatch: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value as string | undefined;
  const confirmation = control.get('password_confirmation')?.value as string | undefined;
  return password && password !== confirmation ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule, RouterLink, NzAlertModule, NzAvatarModule, NzButtonModule, NzCardModule,
    NzFormModule, NzInputModule, NzSelectModule, NzSpinModule
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UserService);
  readonly auth = inject(AuthService);
  private readonly messages = inject(NzMessageService);
  private previewObjectUrl: string | null = null;

  readonly userId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = Boolean(this.userId);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.pattern(E164_PHONE)],
    password: ['', this.isEdit ? [Validators.pattern(STRONG_PASSWORD)] : [Validators.required, Validators.pattern(STRONG_PASSWORD)]],
    password_confirmation: ['', this.isEdit ? [] : [Validators.required]],
    profile_ids: [[] as string[]]
  }, { validators: passwordsMatch });

  profiles: ProfileOption[] = [];
  user: UserRecord | null = null;
  photoFile: File | null = null;
  photoPreview: string | undefined;
  photoError = '';
  serverErrors: Record<string, string[]> = {};
  isLoading = true;
  isSubmitting = false;
  profilesUnavailable = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePhotoPreview());
    this.loadData();
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.photoError = '';

    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError = 'Selecciona una imagen JPEG, PNG o WEBP.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = 'La imagen no puede superar 5 MB.';
      input.value = '';
      return;
    }

    this.revokePhotoPreview();
    this.photoFile = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.photoPreview = this.previewObjectUrl;
  }

  submit(): void {
    this.serverErrors = {};
    if (!this.isEdit && !this.photoFile) this.photoError = 'La foto de perfil es obligatoria.';

    if (this.form.invalid || (!this.isEdit && !this.photoFile) || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.form.getRawValue() as UserFormValue;
    const request$ = this.isEdit && this.userId
      ? this.usersApi.update(this.userId, value, this.photoFile)
      : this.usersApi.create(value, this.photoFile as File);

    request$.pipe(finalize(() => this.isSubmitting = false)).subscribe({
      next: response => {
        this.messages.success(response.message);
        void this.router.navigate(['/users', response.data.id]);
      },
      error: error => {
        this.captureServerErrors(error);
        this.messages.error(getApiErrorMessage(error, `No fue posible ${this.isEdit ? 'actualizar' : 'crear'} el usuario.`));
      }
    });
  }

  fieldServerError(field: string): string | null {
    const direct = this.serverErrors[field]?.[0];
    if (direct) return direct;
    const nestedKey = Object.keys(this.serverErrors).find(key => key.startsWith(`${field}.`));
    return nestedKey ? this.serverErrors[nestedKey][0] : null;
  }

  private loadData(): void {
    const profiles$ = this.auth.hasSection('profiles')
      ? this.usersApi.listProfiles()
      : of([] as ProfileOption[]);
    const user$ = this.isEdit && this.userId ? this.usersApi.get(this.userId) : of(null);

    forkJoin({ profiles: profiles$, userResponse: user$ }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ profiles, userResponse }) => {
        this.profiles = profiles;
        if (userResponse) {
          this.user = userResponse.data;
          this.form.patchValue({
            name: this.user.name,
            email: this.user.email,
            phone: this.user.phone ?? '',
            profile_ids: this.user.profile_ids
          });
          this.photoPreview = this.usersApi.photoUrl(this.user.photo);
        }
        this.profilesUnavailable = !this.auth.hasSection('profiles');
      },
      error: error => {
        this.messages.error(getApiErrorMessage(error, 'No fue posible cargar los datos del formulario.'));
        if (this.isEdit) void this.router.navigate(['/users']);
        else {
          this.profilesUnavailable = true;
          this.isLoading = false;
        }
      }
    });
  }

  private captureServerErrors(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) return;
    const body = error.error as ApiErrorResponse | null;
    this.serverErrors = body?.errors ?? {};
    for (const key of Object.keys(this.serverErrors)) {
      const controlName = key.split('.')[0] as keyof UserFormValue;
      this.form.controls[controlName]?.setErrors({ server: true });
    }
  }

  private revokePhotoPreview(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }
}
