import { Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InvoiceApi } from '../../../core/invoices/invoice-api';
import { InvoicePrefill, LineItemSource, Money, MilestoneOption } from '../../../model/invoice';

export interface AddLineItemDialogData {
  invoiceId: string;
  tenantId: string;
  projectId?: string;
  existingMilestoneIds: string[];
}

interface DraftLineItem {
  key: string;
  source: LineItemSource;
  milestoneId?: string;
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: Money;
  taxRatePercentage: number;
}

@Component({
  selector: 'app-add-line-item-dialog',
  imports: [],
  templateUrl: './add-line-item-dialog.html',
  styleUrl: './add-line-item-dialog.scss',
})
export class AddLineItemDialog {
  private readonly dialogRef = inject(MatDialogRef<AddLineItemDialog>);
  private readonly invoiceApi = inject(InvoiceApi);
  protected readonly data = inject<AddLineItemDialogData>(MAT_DIALOG_DATA);

  readonly taxRateOptions = [19, 7, 0];

  readonly draftItems = signal<DraftLineItem[]>([]);

  readonly freeDescription = signal('');
  readonly freeQuantity = signal('1');
  readonly freeUnitPrice = signal('');
  readonly freeTaxRate = signal(19);

  readonly submitting = signal(false);

  private readonly prefillResource = httpResource<InvoicePrefill>(() =>
    this.data.projectId
      ? `${environment.apiBaseUrl}/invoices/prefill?tenantId=${this.data.tenantId}&projectId=${this.data.projectId}`
      : undefined,
  );

  readonly prefillLoading = computed(() => this.prefillResource.isLoading());

  // Meilensteine, die auf DIESER Rechnung noch nicht drauf sind, dazu noch
  // nicht lokal ausgewählt - alleiniger Blocker bleibt "wirklich ausgestellt"
  readonly availableMilestones = computed<MilestoneOption[]>(() => {
    const all = this.prefillResource.value()?.availableMilestones ?? [];
    return all.filter((m) => !this.data.existingMilestoneIds.includes(m.id));
  });

  isMilestoneAdded(milestoneId: string): boolean {
    return this.draftItems().some((i) => i.milestoneId === milestoneId);
  }

  toggleMilestone(milestone: MilestoneOption): void {
    if (milestone.alreadyInvoiced) return;

    if (this.isMilestoneAdded(milestone.id)) {
      this.draftItems.update((list) => list.filter((i) => i.milestoneId !== milestone.id));
      return;
    }

    this.draftItems.update((list) => [
      ...list,
      {
        key: crypto.randomUUID(),
        source: 'MILESTONE',
        milestoneId: milestone.id,
        description: milestone.title,
        quantity: 1,
        unitCode: 'C62',
        unitPrice: milestone.price ?? { amount: 0, currencyCode: 'EUR' },
        taxRatePercentage: 19,
      },
    ]);
  }

  addFreePosition(): void {
    const description = this.freeDescription().trim();
    const amount = parseFloat(this.freeUnitPrice().replace(',', '.'));
    const quantity = parseFloat(this.freeQuantity().replace(',', '.')) || 1;

    if (!description || isNaN(amount) || amount <= 0) return;

    this.draftItems.update((list) => [
      ...list,
      {
        key: crypto.randomUUID(),
        source: 'CUSTOM',
        description,
        quantity,
        unitCode: 'C62',
        unitPrice: { amount, currencyCode: 'EUR' },
        taxRatePercentage: this.freeTaxRate(),
      },
    ]);

    this.freeDescription.set('');
    this.freeQuantity.set('1');
    this.freeUnitPrice.set('');
    this.freeTaxRate.set(19);
  }

  removeDraftItem(key: string): void {
    this.draftItems.update((list) => list.filter((i) => i.key !== key));
  }

  updateItemTaxRate(key: string, rate: number): void {
    this.draftItems.update((list) =>
      list.map((i) => (i.key === key ? { ...i, taxRatePercentage: rate } : i)),
    );
  }

  formatMoney(amount: number, currencyCode = 'EUR'): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currencyCode }).format(
      amount,
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    const items = this.draftItems();
    if (items.length === 0) return;

    this.submitting.set(true);
    try {
      // Nacheinander statt Promise.all - jeder Call hängt vom aktuellen
      // Rechnungsstatus ab, parallel wäre bei schnellen Doppelklicks riskant
      for (const item of items) {
        await firstValueFrom(
          this.invoiceApi.addLineItem(this.data.invoiceId, {
            source: item.source,
            milestoneId: item.milestoneId,
            description: item.description,
            quantity: item.quantity,
            unitCode: item.unitCode,
            unitPrice: item.unitPrice,
            taxRatePercentage: item.taxRatePercentage,
          }),
        );
      }
      this.dialogRef.close(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
