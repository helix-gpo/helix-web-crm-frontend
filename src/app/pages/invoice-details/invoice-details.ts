import { Component, computed, inject, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvoiceApi } from '../../core/invoices/invoice-api';
import { InvoiceStore } from '../../core/invoices/invoice-store';
import { TenantStore } from '../../core/tenants/tenant-store';
import { ProjectStore } from '../../core/projects/project-store';
import { Toast } from '../../core/toast/toast';
import { ConfirmDialog } from '../../util/confirm-dialog/confirm-dialog';
import { AddLineItemDialog } from './add-line-item-dialog/add-line-item-dialog';
import {
  Address,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  Money,
  UpdateInvoiceHeaderRequest,
} from '../../model/invoice';
import { EditLineItemDialog } from './edit-line-item-dialog/edit-line-item-dialog';

@Component({
  selector: 'app-invoice-detail',
  imports: [MatDialogModule],
  templateUrl: './invoice-details.html',
  styleUrl: './invoice-details.scss',
})
export class InvoiceDetail {
  readonly id = input.required<string>();

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly invoiceApi = inject(InvoiceApi);
  private readonly invoiceStore = inject(InvoiceStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly projectStore = inject(ProjectStore);
  private readonly toast = inject(Toast);

  readonly editingHeader = signal(false);
  readonly headerBuyerReference = signal('');
  readonly headerPaymentTermsDays = signal('');
  readonly savingHeader = signal(false);

  readonly deletingDraft = signal(false);

  private readonly invoiceResource = httpResource<Invoice>(
    () => `${environment.apiBaseUrl}/invoices/${this.id()}`,
  );

  readonly invoice = computed(() => this.invoiceResource.value());
  readonly loading = computed(() => this.invoiceResource.isLoading());

  readonly statusLabels: Record<InvoiceStatus, string> = {
    DRAFT: 'Entwurf',
    ISSUED: 'Ausgestellt',
    SENT: 'Versendet',
    PAID: 'Bezahlt',
    OVERDUE: 'Überfällig',
    CANCELLED: 'Storniert',
  };

  readonly tenantName = computed(() => {
    const inv = this.invoice();
    if (!inv) return '';
    return (
      this.tenantStore.tenants().find((t) => t.id === inv.tenantId)?.companyName ?? 'Unbekannt'
    );
  });

  readonly projectName = computed(() => {
    const inv = this.invoice();
    if (!inv?.projectId) return '';
    return this.projectStore.projects().find((p) => p.id === inv.projectId)?.title ?? 'Unbekannt';
  });

  readonly isDraft = computed(() => this.invoice()?.status === 'DRAFT');

  readonly issuing = signal(false);

  private refreshEverywhere(): void {
    this.invoiceResource.reload();
    this.invoiceStore.reload();
  }

  back(): void {
    this.router.navigate(['/invoices']);
  }

  itemNet(item: InvoiceLineItem): Money {
    return item.netAmount;
  }

  formatMoney(money?: Money): string {
    if (!money) return '–';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: money.currencyCode,
    }).format(money.amount);
  }

  formatAddress(address?: Address): string {
    if (!address) return '–';
    const line1 = [address.street, address.houseNumber].filter(Boolean).join(' ');
    const line2 = [address.postalCode, address.city].filter(Boolean).join(' ');
    return [line1, line2].filter(Boolean).join(', ');
  }

  openAddLineItemDialog(): void {
    const inv = this.invoice();
    if (!inv) return;

    const dialogRef = this.dialog.open(AddLineItemDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
      data: {
        invoiceId: inv.id,
        tenantId: inv.tenantId,
        projectId: inv.projectId,
        existingMilestoneIds: inv.lineItems
          .map((i) => i.milestoneId)
          .filter((id): id is string => !!id),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshEverywhere();
        this.toast.success('Position hinzugefügt');
      }
    });
  }

  async removeLineItem(item: InvoiceLineItem): Promise<void> {
    const inv = this.invoice();
    if (!inv) return;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '44rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Position entfernen?',
        message: `"${item.description}" wird von dieser Rechnung entfernt.`,
        confirmLabel: 'Entfernen',
        danger: true,
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await firstValueFrom(this.invoiceApi.removeLineItem(inv.id, item.id));
        this.refreshEverywhere();
        this.toast.success('Position entfernt');
      } catch {
        this.toast.error('Position konnte nicht entfernt werden');
      }
    }
  }

  async issueInvoice(): Promise<void> {
    const inv = this.invoice();
    if (!inv) return;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '48rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Rechnung ausstellen?',
        message:
          'Die Rechnung erhält eine lückenlose Rechnungsnummer und wird verbindlich - Positionen können danach nicht mehr geändert werden.',
        confirmLabel: 'Ausstellen',
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    this.issuing.set(true);
    try {
      await firstValueFrom(this.invoiceApi.issue(inv.id));
      this.refreshEverywhere();
      this.toast.success('Rechnung ausgestellt');
    } catch {
      this.toast.error('Rechnung konnte nicht ausgestellt werden');
    } finally {
      this.issuing.set(false);
    }
  }

  startEditHeader(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.headerBuyerReference.set(inv.buyerReference ?? '');
    this.headerPaymentTermsDays.set(inv.paymentTermsDays?.toString() ?? '14');
    this.editingHeader.set(true);
  }

  cancelEditHeader(): void {
    this.editingHeader.set(false);
  }

  async saveHeader(): Promise<void> {
    const inv = this.invoice();
    if (!inv) return;

    this.savingHeader.set(true);
    const request: UpdateInvoiceHeaderRequest = {
      buyerReference: this.headerBuyerReference().trim() || undefined,
      paymentTermsDays: parseInt(this.headerPaymentTermsDays(), 10) || undefined,
    };

    try {
      await firstValueFrom(this.invoiceApi.updateHeader(inv.id, request));
      this.editingHeader.set(false);
      this.refreshEverywhere();
      this.toast.success('Rechnungsdaten aktualisiert');
    } catch {
      this.toast.error('Aktualisierung fehlgeschlagen');
    } finally {
      this.savingHeader.set(false);
    }
  }

  openEditLineItemDialog(item: InvoiceLineItem): void {
    const inv = this.invoice();
    if (!inv) return;

    const dialogRef = this.dialog.open(EditLineItemDialog, {
      width: '48rem',
      panelClass: 'app-dialog-panel',
      data: { invoiceId: inv.id, item },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshEverywhere();
        this.toast.success('Position aktualisiert');
      }
    });
  }

  async deleteDraftInvoice(): Promise<void> {
    const inv = this.invoice();
    if (!inv) return;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '46rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Rechnungsentwurf löschen?',
        message: 'Der komplette Entwurf inkl. aller Positionen wird unwiderruflich gelöscht.',
        confirmLabel: 'Löschen',
        danger: true,
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    this.deletingDraft.set(true);
    try {
      await firstValueFrom(this.invoiceApi.deleteDraft(inv.id));
      this.invoiceStore.reload();
      this.toast.success('Entwurf gelöscht');
      this.router.navigate(['/invoices']);
    } catch {
      this.toast.error('Löschen fehlgeschlagen');
      this.deletingDraft.set(false);
    }
  }
}
