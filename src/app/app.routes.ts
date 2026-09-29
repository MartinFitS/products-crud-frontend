import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { defaultRouteGuard, sectionGuard } from './core/auth/section.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', canActivate: [defaultRouteGuard], children: [] },
      {
        path: 'products',
        canActivate: [sectionGuard],
        data: { section: 'products' },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
          }
        ]
      },
      {
        path: 'users',
        canActivate: [sectionGuard],
        data: { section: 'users' },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/users/user-detail/user-detail.component').then(m => m.UserDetailComponent)
          }
        ]
      },
      {
        path: 'profiles',
        canActivate: [sectionGuard],
        data: { section: 'profiles' },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/profiles/profile-list/profile-list.component').then(m => m.ProfileListComponent)
          },
          {
            path: 'sections',
            loadComponent: () => import('./features/profiles/section-management/section-management.component').then(m => m.SectionManagementComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/profiles/profile-form/profile-form.component').then(m => m.ProfileFormComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/profiles/profile-form/profile-form.component').then(m => m.ProfileFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/profiles/profile-detail/profile-detail.component').then(m => m.ProfileDetailComponent)
          }
        ]
      },
      {
        path: 'audit-logs',
        canActivate: [sectionGuard],
        data: { section: 'audit-logs' },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/audit-logs/audit-log-list/audit-log-list.component').then(m => m.AuditLogListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/audit-logs/audit-log-detail/audit-log-detail.component').then(m => m.AuditLogDetailComponent)
          }
        ]
      },
      {
        path: 'unauthorized',
        loadComponent: () => import('./features/access/unauthorized.component').then(m => m.UnauthorizedComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
