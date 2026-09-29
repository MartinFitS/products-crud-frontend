import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-unauthorized',
  imports: [RouterLink, NzButtonModule, NzResultModule],
  template: `
    <nz-result nzStatus="403" nzTitle="Sin acceso" nzSubTitle="Tu cuenta no tiene acceso a esta sección.">
      <div nz-result-extra>
        @if (auth.getDefaultRouteForUser() !== '/unauthorized') {
          <a nz-button nzType="primary" [routerLink]="auth.getDefaultRouteForUser()">Ir a mi página principal</a>
        } @else {
          <p>Solicita a un administrador que asigne una sección a uno de tus perfiles.</p>
        }
      </div>
    </nz-result>
  `
})
export class UnauthorizedComponent {
  readonly auth = inject(AuthService);
}
