import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface SendInvoiceDialogData {
  buyerEmail?: string;
}

@Component({
  selector: 'app-send-invoice-dialog',
  imports: [],
  templateUrl: './send-invoice-dialog.html',
  styleUrl: './send-invoice-dialog.scss',
})
export class SendInvoiceDialog {
  private readonly dialogRef = inject(MatDialogRef<SendInvoiceDialog>);
  protected readonly data = inject<SendInvoiceDialogData>(MAT_DIALOG_DATA);

  protected readonly email = signal(this.data.buyerEmail ?? '');
  protected readonly canConfirm = computed(() => this.email().trim().length > 3);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    if (!this.canConfirm()) return;
    this.dialogRef.close(this.email().trim());
  }
}
