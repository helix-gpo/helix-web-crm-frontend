import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Tenants } from './pages/tenants/tenants';
import { TenantDetail } from './pages/tenant-detail/tenant-detail';
import { Projects } from './pages/projects/projects';
import { Invoices } from './pages/invoices/invoices';
import { Testimonials } from './pages/testimonials/testimonials';
import { Website } from './pages/website/website';
import { Welcome } from './pages/welcome/welcome';
import { Login } from './pages/login/login';
import { SessionExpired } from './pages/session-expired/session-expired';
import { authGuard } from './core/auth/auth.guard';
import { ProjectDetail } from './pages/project-details/project-details';
import { InvoiceDetail } from './pages/invoice-details/invoice-details';
import { adminGuard } from './core/auth/admin.guard';
import { Roles } from './pages/roles/roles';
import { Employees } from './pages/employees/employees';
import { permissionGuard } from './core/access/permission.guard';

export const routes: Routes = [
  { path: '', component: Welcome },
  { path: 'login', component: Login },
  { path: 'session-expired', component: SessionExpired },
  { path: 'callback', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'tenants', component: Tenants, canActivate: [authGuard, permissionGuard('TENANT:READ')] },
  {
    path: 'tenants/:id',
    component: TenantDetail,
    canActivate: [authGuard, permissionGuard('TENANT:READ')],
  },
  {
    path: 'projects',
    component: Projects,
    canActivate: [authGuard, permissionGuard('PROJECT:READ')],
  },
  {
    path: 'projects/:id',
    component: ProjectDetail,
    canActivate: [authGuard, permissionGuard('PROJECT:READ')],
  },
  {
    path: 'invoices',
    component: Invoices,
    canActivate: [authGuard, permissionGuard('INVOICE:READ')],
  },
  {
    path: 'invoices/:id',
    component: InvoiceDetail,
    canActivate: [authGuard, permissionGuard('INVOICE:READ')],
  },
  {
    path: 'testimonials',
    component: Testimonials,
    canActivate: [authGuard, permissionGuard('TESTIMONIAL:READ')],
  },
  {
    path: 'website',
    component: Website,
    canActivate: [authGuard, permissionGuard('TESTIMONIAL:READ')],
  },
  { path: 'settings/roles', component: Roles, canActivate: [authGuard, adminGuard] },
  { path: 'settings/employees', component: Employees, canActivate: [authGuard, adminGuard] },
];
