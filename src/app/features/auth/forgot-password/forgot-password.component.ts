import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

import { AuthService } from '../../../core/auth/auth.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, NzAlertModule, NzButtonModule, NzCardModule, NzFormModule, NzInputModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.auth.forgotPassword(this.form.getRawValue()).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: response => {
        this.successMessage = response.message;
        this.form.reset();
      },
      error: error => this.errorMessage = getApiErrorMessage(error, 'No fue posible procesar la solicitud. Intenta nuevamente.')
    });
  }
}
