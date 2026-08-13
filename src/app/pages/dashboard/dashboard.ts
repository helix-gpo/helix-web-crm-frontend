import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TenantStore } from '../../core/tenants/tenant-store';
import { ProjectStore } from '../../core/projects/project-store';
import { InvoiceStore } from '../../core/invoices/invoice-store';
import { Toast } from '../../core/toast/toast';
import { Auth } from '../../core/auth/auth';
import { CreateTenantDialog } from '../tenants/create-tenant-dialog/create-tenant-dialog';
import { CreateProjectDialog } from '../projects/create-project-dialog/create-project-dialog';
import { CreateInvoiceDialog } from '../invoices/create-invoice-dialog/create-invoice-dialog';
import { ProjectStatus } from '../../model/project';
import { Money } from '../../model/invoice';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);

  protected readonly tenantStore = inject(TenantStore);
  protected readonly projectStore = inject(ProjectStore);
  protected readonly invoiceStore = inject(InvoiceStore);

  readonly loading = computed(
    () => this.tenantStore.loading() || this.projectStore.loading() || this.invoiceStore.loading(),
  );

  private readonly openInvoiceStatuses = ['ISSUED', 'SENT', 'OVERDUE'];

  private readonly tenantNameById = computed(() => {
    const map = new Map<string, string>();
    this.tenantStore.tenants().forEach((t) => map.set(t.id, t.companyName));
    return map;
  });

  private readonly projectNameById = computed(() => {
    const map = new Map<string, string>();
    this.projectStore.projects().forEach((p) => map.set(p.id, p.title));
    return map;
  });

  tenantName(tenantId: string): string {
    return this.tenantNameById().get(tenantId) ?? 'Unbekannt';
  }

  projectName(projectId?: string): string {
    if (!projectId) return '';
    return this.projectNameById().get(projectId) ?? '';
  }

  // ---- KPIs ----

  readonly openAmount = computed(() =>
    this.invoiceStore
      .invoices()
      .filter((i) => this.openInvoiceStatuses.includes(i.status))
      .reduce((sum, i) => sum + i.grossTotal.amount, 0),
  );

  readonly overdueCount = computed(
    () => this.invoiceStore.invoices().filter((i) => i.status === 'OVERDUE').length,
  );

  readonly activeProjectsCount = computed(
    () => this.projectStore.projects().filter((p) => p.status === 'IN_PROGRESS').length,
  );

  readonly activeTenantsCount = computed(
    () => this.tenantStore.tenants().filter((t) => t.status === 'ACTIVE').length,
  );

  // ---- Anstehende & überfällige Rechnungen ----

  // Nur offene Rechnungen mit Fälligkeitsdatum, aufsteigend sortiert -
  // die dringendsten (überfällig oder bald fällig) landen ganz oben
  readonly upcomingInvoices = computed(() =>
    this.invoiceStore
      .invoices()
      .filter((i) => this.openInvoiceStatuses.includes(i.status) && !!i.dueDate)
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0))
      .slice(0, 5),
  );

  // ---- Projekte nach Status ----

  private readonly projectStatusOrder: ProjectStatus[] = [
    'LEAD',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
  ];

  readonly projectStatusLabels: Record<ProjectStatus, string> = {
    LEAD: 'Interessent',
    IN_PROGRESS: 'In Arbeit',
    ON_HOLD: 'Pausiert',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Abgebrochen',
  };

  readonly projectsByStatus = computed(() => {
    const all = this.projectStore.projects();
    const total = all.length;

    return this.projectStatusOrder.map((status) => {
      const count = all.filter((p) => p.status === status).length;
      return {
        status,
        label: this.projectStatusLabels[status],
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  });

  // ---- Formatierung ----

  formatMoney(money: Money): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: money.currencyCode,
    }).format(money.amount);
  }

  formatAmount(amount: number, currencyCode = 'EUR'): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currencyCode }).format(
      amount,
    );
  }

  // ---- Navigation ----

  openInvoice(invoiceId: string): void {
    this.router.navigate(['/invoices', invoiceId]);
  }

  // ---- Schnellzugriff ----

  openCreateTenantDialog(): void {
    const dialogRef = this.dialog.open(CreateTenantDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Mandant angelegt');
    });
  }

  openCreateProjectDialog(): void {
    const dialogRef = this.dialog.open(CreateProjectDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Projekt angelegt');
    });
  }

  openCreateInvoiceDialog(): void {
    const dialogRef = this.dialog.open(CreateInvoiceDialog, {
      width: '68rem',
      panelClass: 'app-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.toast.success('Rechnung angelegt');
        this.router.navigate(['/invoices', result.id]);
      }
    });
  }
}
