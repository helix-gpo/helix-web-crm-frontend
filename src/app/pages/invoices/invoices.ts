import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { InvoiceStore } from '../../core/invoices/invoice-store';
import { TenantStore } from '../../core/tenants/tenant-store';
import { Invoice, InvoiceStatus } from '../../model/invoice';
import { MatDialog } from '@angular/material/dialog';
import { Toast } from '../../core/toast/toast';
import { CreateInvoiceDialog } from './create-invoice-dialog/create-invoice-dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoices',
  imports: [DecimalPipe],
  templateUrl: './invoices.html',
  styleUrl: './invoices.scss',
})
export class Invoices {
  protected readonly invoiceStore = inject(InvoiceStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);

  readonly statusLabels: Record<InvoiceStatus, string> = {
    DRAFT: 'Entwurf',
    ISSUED: 'Ausgestellt',
    SENT: 'Versendet',
    PAID: 'Bezahlt',
    OVERDUE: 'Überfällig',
    CANCELLED: 'Storniert',
  };

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
