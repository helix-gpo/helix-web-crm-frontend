import { Component, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-mark-paid-dialog',
  imports: [],
  templateUrl: './mark-paid-dialog.html',
  styleUrl: './mark-paid-dialog.scss',
})
export class MarkPaidDialog {
  private readonly dialogRef = inject(MatDialogRef<MarkPaidDialog>);

  protected readonly paidDate = signal(new Date().toISOString().slice(0, 10));

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(this.paidDate());
  }
}
