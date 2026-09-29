import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-section-placeholder',
  imports: [NzAlertModule],
  template: `
    <div class="page-heading">
      <p>Sección autorizada</p>
      <h1>{{ title }}</h1>
    </div>
    <nz-alert nzType="info" nzShowIcon
      nzMessage="Acceso configurado"
      nzDescription="La autenticación y el permiso para esta sección ya están activos. El CRUD se implementará en una etapa posterior." />
  `,
  styles: [`
    .page-heading { margin-bottom: 24px; }
    .page-heading p { margin: 0 0 4px; color: #1677ff; font-weight: 600; }
    .page-heading h1 { margin: 0; font-size: clamp(26px, 4vw, 36px); }
  `]
})
export class SectionPlaceholderComponent {
  readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
