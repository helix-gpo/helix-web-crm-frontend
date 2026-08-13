import { Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { InvoiceStore } from '../../../core/invoices/invoice-store';
import { ProjectStore } from '../../../core/projects/project-store';
import { TenantStore } from '../../../core/tenants/tenant-store';
import {
  CreateInvoiceRequest,
  InvoicePrefill,
  LineItemSource,
  Money,
  MilestoneOption,
} from '../../../model/invoice';

export interface CreateInvoiceDialogData {
  tenantId?: string;
  projectId?: string;
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
  selector: 'app-create-invoice-dialog',
  imports: [],
  templateUrl: './create-invoice-dialog.html',
  styleUrl: './create-invoice-dialog.scss',
})
export class CreateInvoiceDialog {
  private readonly dialogRef = inject(MatDialogRef<CreateInvoiceDialog>);
  private readonly invoiceStore = inject(InvoiceStore);
  protected readonly tenantStore = inject(TenantStore);
  protected readonly projectStore = inject(ProjectStore);
  private readonly dialogData = inject<CreateInvoiceDialogData | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly taxRateOptions = [19, 7, 0];

  readonly tenantId = signal(this.dialogData?.tenantId ?? '');
  readonly tenantLocked = computed(() => !!this.dialogData?.tenantId);
  readonly projectLocked = computed(() => !!this.dialogData?.projectId);
  readonly projectId = signal(this.dialogData?.projectId ?? '');
  readonly dataLoading = computed(() => this.tenantStore.loading() || this.projectStore.loading());

  readonly buyerReference = signal('');
  readonly paymentTermsDays = signal('14');

  readonly lineItems = signal<DraftLineItem[]>([]);

  readonly freeDescription = signal('');
  readonly freeQuantity = signal('1');
  readonly freeUnitPrice = signal('');
  readonly freeTaxRate = signal(19);

  readonly submitting = signal(false);
  readonly showWarning = signal(false);

  // Nur Projekte des gewählten Mandanten - Projekt ist bei uns Pflichtfeld
  readonly tenantProjects = computed(() =>
    this.projectStore.projects().filter((p) => p.tenantId === this.tenantId()),
  );

  private readonly prefillResource = httpResource<InvoicePrefill>(() => {
    const tenantId = this.tenantId();
    const projectId = this.projectId();
    return tenantId && projectId
      ? `${environment.apiBaseUrl}/invoices/prefill?tenantId=${tenantId}&projectId=${projectId}`
      : undefined;
  });

  readonly prefill = computed(() => this.prefillResource.value());
  readonly prefillLoading = computed(() => this.prefillResource.isLoading());

  readonly totals = computed(() => {
    const items = this.lineItems();
    return {
      net: items.reduce((sum, i) => sum + this.itemNet(i), 0),
      tax: items.reduce((sum, i) => sum + this.itemTax(i), 0),
      gross: items.reduce((sum, i) => sum + this.itemGross(i), 0),
    };
  });

  // Aufschlüsselung pro Steuersatz - genau das, was auf der Rechnung als
  // eigene USt-Zeile je Satz ausgewiesen werden muss
  readonly taxBreakdown = computed(() => {
    const map = new Map<number, { net: number; tax: number }>();
    for (const item of this.lineItems()) {
      const net = this.itemNet(item);
      const tax = this.itemTax(item);
      const entry = map.get(item.taxRatePercentage) ?? { net: 0, tax: 0 };
      entry.net += net;
      entry.tax += tax;
      map.set(item.taxRatePercentage, entry);
    }
    return [...map.entries()]
      .map(([rate, values]) => ({ rate, ...values }))
      .sort((a, b) => b.rate - a.rate);
  });

  readonly isValid = computed(
    () => !!this.tenantId() && !!this.projectId() && this.lineItems().length > 0,
  );

  itemNet(item: DraftLineItem): number {
    return item.unitPrice.amount * item.quantity;
  }

  itemTax(item: DraftLineItem): number {
    return this.itemNet(item) * (item.taxRatePercentage / 100);
  }

  itemGross(item: DraftLineItem): number {
    return this.itemNet(item) + this.itemTax(item);
  }

  onTenantChange(value: string): void {
    this.tenantId.set(value);
    this.projectId.set('');
    this.lineItems.set([]);
  }

  onProjectChange(value: string): void {
    this.projectId.set(value);
    this.lineItems.set([]);
  }

  isMilestoneAdded(milestoneId: string): boolean {
    return this.lineItems().some((i) => i.milestoneId === milestoneId);
  }

  toggleMilestone(milestone: MilestoneOption): void {
    if (milestone.alreadyInvoiced) return;

    if (this.isMilestoneAdded(milestone.id)) {
      this.lineItems.update((list) => list.filter((i) => i.milestoneId !== milestone.id));
      return;
    }

    this.lineItems.update((list) => [
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

    this.lineItems.update((list) => [
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

  removeLineItem(key: string): void {
    this.lineItems.update((list) => list.filter((i) => i.key !== key));
  }

  updateItemTaxRate(key: string, rate: number): void {
    this.lineItems.update((list) =>
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
    if (!this.isValid()) {
      this.showWarning.set(true);
      return;
    }

    this.submitting.set(true);

    const request: CreateInvoiceRequest = {
      tenantId: this.tenantId(),
      projectId: this.projectId(),
      buyerReference: this.buyerReference().trim() || undefined,
      paymentTermsDays: parseInt(this.paymentTermsDays(), 10) || undefined,
      lineItems: this.lineItems().map((i) => ({
        source: i.source,
        milestoneId: i.milestoneId,
        description: i.description,
        quantity: i.quantity,
        unitCode: i.unitCode,
        unitPrice: i.unitPrice,
        taxRatePercentage: i.taxRatePercentage,
      })),
    };

    try {
      const invoice = await this.invoiceStore.create(request);
      this.dialogRef.close(invoice);
    } finally {
      this.submitting.set(false);
    }
  }
}
