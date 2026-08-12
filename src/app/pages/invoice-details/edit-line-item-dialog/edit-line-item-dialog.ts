import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { InvoiceApi } from '../../../core/invoices/invoice-api';
import { InvoiceLineItem } from '../../../model/invoice';

export interface EditLineItemDialogData {
  invoiceId: string;
  item: InvoiceLineItem;
}

@Component({
  selector: 'app-edit-line-item-dialog',
  imports: [],
  templateUrl: './edit-line-item-dialog.html',
  styleUrl: './edit-line-item-dialog.scss',
})
export class EditLineItemDialog {
  private readonly dialogRef = inject(MatDialogRef<EditLineItemDialog>);
  private readonly invoiceApi = inject(InvoiceApi);
  protected readonly data = inject<EditLineItemDialogData>(MAT_DIALOG_DATA);

  readonly taxRateOptions = [19, 7, 0];

  readonly description = signal(this.data.item.description);
  readonly quantity = signal(this.data.item.quantity.toString());
  readonly unitPrice = signal(this.data.item.unitPrice.amount.toString());
  readonly taxRate = signal(this.data.item.taxRatePercentage);

  readonly submitting = signal(false);
  readonly showWarning = signal(false);

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    const description = this.description().trim();
    const amount = parseFloat(this.unitPrice().replace(',', '.'));
    const quantity = parseFloat(this.quantity().replace(',', '.'));

    if (!description || isNaN(amount) || amount <= 0 || isNaN(quantity) || quantity <= 0) {
      this.showWarning.set(true);
      return;
    }

    this.submitting.set(true);
    try {
      const result = await firstValueFrom(
        this.invoiceApi.updateLineItem(this.data.invoiceId, this.data.item.id, {
          description,
          quantity,
          unitCode: this.data.item.unitCode,
          unitPrice: { amount, currencyCode: this.data.item.unitPrice.currencyCode },
          taxRatePercentage: this.taxRate(),
        }),
      );
      this.dialogRef.close(result);
    } finally {
      this.submitting.set(false);
    }
  }
}
