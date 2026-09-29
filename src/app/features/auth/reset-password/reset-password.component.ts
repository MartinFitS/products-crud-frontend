import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthService } from '../../../core/auth/auth.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

const passwordsMatch: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmation = control.get('password_confirmation')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, NzAlertModule, NzButtonModule, NzCardModule, NzFormModule, NzInputModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(NzMessageService);
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  readonly hasValidLink = Boolean(this.token && this.email);
  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required]
  }, { validators: passwordsMatch });
  isSubmitting = false;
  errorMessage = '';

  submit(): void {
    if (!this.hasValidLink || this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    const values = this.form.getRawValue();
    this.auth.resetPassword({ email: this.email, token: this.token, ...values }).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: response => {
        this.messages.success(response.message);
        void this.router.navigate(['/login']);
      },
      error: error => this.errorMessage = getApiErrorMessage(error, 'No fue posible restablecer la contraseña. Solicita un enlace nuevo.')
    });
  }
}
