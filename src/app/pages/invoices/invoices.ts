import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { InvoiceStore } from '../../core/invoices/invoice-store';
import { TenantStore } from '../../core/tenants/tenant-store';
import { Invoice, InvoiceStatus } from '../../model/invoice';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Toast } from '../../core/toast/toast';
import { CreateInvoiceDialog } from './create-invoice-dialog/create-invoice-dialog';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { SortableHeader } from '../../shared/sortable-header/sortable-header';
import {
  FilterDialog,
  FilterFieldConfig,
  ActiveFilters,
} from '../../shared/filter-dialog/filter-dialog';
import { cycleSort, sortByKey, SortState, SortDirection } from '../../util/sortable/sortable';

type InvoiceSortKey =
  'invoiceNumber' | 'tenantName' | 'issueDate' | 'dueDate' | 'amount' | 'status';

@Component({
  selector: 'app-invoices',
  imports: [DecimalPipe, MatDialogModule, SortableHeader],
  templateUrl: './invoices.html',
  styleUrl: './invoices.scss',
})
export class Invoices {
  protected readonly invoiceStore = inject(InvoiceStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);

  readonly searchTerm = signal('');
  readonly sort = signal<SortState<InvoiceSortKey>>({ key: null, direction: null });
  readonly activeFilters = signal<ActiveFilters>({});

  readonly statusLabels: Record<InvoiceStatus, string> = {
    DRAFT: 'Entwurf',
    ISSUED: 'Ausgestellt',
    SENT: 'Versendet',
    PAID: 'Bezahlt',
    OVERDUE: 'Überfällig',
    CANCELLED: 'Storniert',
  };

  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: Object.entries(this.statusLabels).map(([value, label]) => ({ value, label })),
    },
  ];

  readonly activeFilterCount = computed(() =>
    Object.values(this.activeFilters()).reduce((sum, values) => sum + values.length, 0),
  );

  private readonly tenantNameById = computed(() => {
    const map = new Map<string, string>();
    this.tenantStore.tenants().forEach((t) => map.set(t.id, t.companyName));
    return map;
  });

  readonly openAmount = computed(() =>
    this.invoiceStore
      .invoices()
      .filter((i) => ['ISSUED', 'SENT', 'OVERDUE'].includes(i.status))
      .reduce((sum, i) => sum + i.grossTotal.amount, 0),
  );

  readonly overdueCount = computed(
    () => this.invoiceStore.invoices().filter((i) => i.status === 'OVERDUE').length,
  );

  readonly draftCount = computed(
    () => this.invoiceStore.invoices().filter((i) => i.status === 'DRAFT').length,
  );

  readonly filteredInvoices = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    let invoices = this.invoiceStore.invoices();

    if (term) {
      invoices = invoices.filter(
        (i) =>
          (i.invoiceNumber ?? '').toLowerCase().includes(term) ||
          this.tenantName(i.tenantId).toLowerCase().includes(term),
      );
    }

    const filters = this.activeFilters();
    if (filters['status']?.length) {
      invoices = invoices.filter((i) => filters['status'].includes(i.status));
    }

    return sortByKey(invoices, this.sort(), (i, key) => {
      switch (key) {
        case 'invoiceNumber':
          return i.invoiceNumber ?? '';
        case 'tenantName':
          return this.tenantName(i.tenantId);
        case 'issueDate':
          return i.issueDate ?? '';
        case 'dueDate':
          return i.dueDate ?? '';
        case 'amount':
          return i.grossTotal.amount;
        case 'status':
          return i.status;
      }
    });
  });

  toggleSort(key: InvoiceSortKey): void {
    this.sort.update((current) => cycleSort(current, key));
  }

  sortDirectionFor(key: InvoiceSortKey): SortDirection {
    const s = this.sort();
    return s.key === key ? s.direction : null;
  }

  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterDialog, {
      width: '48rem',
      panelClass: 'app-dialog-panel',
      data: { fields: this.filterFields, active: this.activeFilters() },
    });

    dialogRef.afterClosed().subscribe((result?: ActiveFilters) => {
      if (result) this.activeFilters.set(result);
    });
  }

  tenantName(tenantId: string): string {
    return this.tenantNameById().get(tenantId) ?? 'Unbekannt';
  }

  formatAmount(invoice: Pick<Invoice, 'grossTotal'>): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: invoice.grossTotal.currencyCode,
    }).format(invoice.grossTotal.amount);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateInvoiceDialog, {
      width: '68rem',
      panelClass: 'app-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Rechnung angelegt');
    });
  }

  openInvoice(invoiceId: string): void {
    this.router.navigate(['/invoices', invoiceId]);
  }
}
