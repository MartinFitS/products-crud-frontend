import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterOutlet, NzButtonModule, NzIconModule, NzLayoutModule, NzMenuModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(NzMessageService);
  isCollapsed = false;
  isLoggingOut = false;

  logout(): void {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;
    this.auth.logout().pipe(finalize(() => this.isLoggingOut = false)).subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => {
        this.messages.warning('La sesión local fue cerrada.');
        void this.router.navigate(['/login']);
      }
    });
  }
}
