import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

import { AuthService } from '../../../core/auth/auth.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, NzAlertModule, NzButtonModule, NzCardModule, NzFormModule, NzInputModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  isSubmitting = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.auth.login(this.form.getRawValue()).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => void this.router.navigateByUrl(this.auth.getDefaultRouteForUser()),
      error: (error: unknown) => {
        this.errorMessage = error instanceof HttpErrorResponse && error.status === 401
          ? 'Correo o contraseña incorrectos.'
          : getApiErrorMessage(error, 'No fue posible iniciar sesión. Intenta nuevamente.');
      }
    });
  }
}
