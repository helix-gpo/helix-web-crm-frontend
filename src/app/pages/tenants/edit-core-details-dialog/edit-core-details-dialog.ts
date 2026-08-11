import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TenantStore } from '../../../core/tenants/tenant-store';
import { Tenant } from '../../../model/tenant';

@Component({
  selector: 'app-edit-core-details-dialog',
  imports: [],
  templateUrl: './edit-core-details-dialog.html',
  styleUrl: './edit-core-details-dialog.scss',
})
export class EditCoreDetailsDialog {
  private readonly dialogRef = inject(MatDialogRef<EditCoreDetailsDialog>);
  private readonly tenantStore = inject(TenantStore);
  
  readonly tenant = inject<Tenant>(MAT_DIALOG_DATA);
  readonly companyName = signal(this.tenant.companyName);
  readonly legalName = signal(this.tenant.legalName ?? '');
  readonly vatId = signal(this.tenant.vatId ?? '');

  // Felder starten gesperrt - verhindert Versehens-Änderungen
  readonly unlocked = signal(false);
  readonly submitting = signal(false);
  readonly showCompanyNameWarning = signal(false);

  unlock(): void {
    this.unlocked.set(true);
  }

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    if (!this.companyName().trim()) {
      this.showCompanyNameWarning.set(true);
      return;
    }

    this.submitting.set(true);

    try {
      const updated = await this.tenantStore.updateCoreDetails(this.tenant.id, {
        companyName: this.companyName().trim(),
        legalName: this.legalName().trim() || undefined,
        vatId: this.vatId().trim() || undefined,
      });
      this.dialogRef.close(updated);
    } finally {
      this.submitting.set(false);
    }
  }
}
