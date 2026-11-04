import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { isValidEmail } from '../../../util/validation/email';

export interface IssueInvoiceDialogData {
  buyerEmail?: string;
}

export interface IssueInvoiceDialogResult {
  sendEmail: boolean;
  email?: string;
}

@Component({
  selector: 'app-issue-invoice-dialog',
  imports: [],
  templateUrl: './issue-invoice-dialog.html',
  styleUrl: './issue-invoice-dialog.scss',
})
export class IssueInvoiceDialog {
  private readonly dialogRef = inject(MatDialogRef<IssueInvoiceDialog>);
  protected readonly data = inject<IssueInvoiceDialogData>(MAT_DIALOG_DATA);

  protected readonly sendEmail = signal(!!this.data.buyerEmail);
  protected readonly email = signal(this.data.buyerEmail ?? '');

  protected readonly emailTouched = signal(false);
  protected readonly emailInvalid = computed(
    () => !this.email().trim() || !isValidEmail(this.email()),
  );
  protected readonly canConfirm = computed(() => !this.sendEmail() || !this.emailInvalid());

  toggleSendEmail(): void {
    this.sendEmail.update((v) => !v);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    if (!this.canConfirm()) return;
    const result: IssueInvoiceDialogResult = {
      sendEmail: this.sendEmail(),
      email: this.sendEmail() ? this.email().trim() : undefined,
    };
    this.dialogRef.close(result);
  }
}
