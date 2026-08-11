import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TenantStore } from '../../../core/tenants/tenant-store';
import { Tenant } from '../../../model/tenant';

@Component({
  selector: 'app-edit-tenant-dialog',
  imports: [],
  templateUrl: './edit-tenant-dialog.html',
  styleUrl: './edit-tenant-dialog.scss',
})
export class EditTenantDialog {
  private readonly dialogRef = inject(MatDialogRef<EditTenantDialog>);
  private readonly tenantStore = inject(TenantStore);
  private readonly tenant = inject<Tenant>(MAT_DIALOG_DATA);

  readonly contactEmail = signal(this.tenant.contactEmail ?? '');
  readonly contactPhone = signal(this.tenant.contactPhone ?? '');
  readonly street = signal(this.tenant.address?.street ?? '');
  readonly houseNumber = signal(this.tenant.address?.houseNumber ?? '');
  readonly postalCode = signal(this.tenant.address?.postalCode ?? '');
  readonly city = signal(this.tenant.address?.city ?? '');

  readonly submitting = signal(false);

  readonly companyName = computed(() => this.tenant.companyName);

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    this.submitting.set(true);

    try {
      const updated = await this.tenantStore.update(this.tenant.id, {
        contactEmail: this.contactEmail().trim() || undefined,
        contactPhone: this.contactPhone().trim() || undefined,
        address:
          this.street() || this.city()
            ? {
                street: this.street().trim() || undefined,
                houseNumber: this.houseNumber().trim() || undefined,
                postalCode: this.postalCode().trim() || undefined,
                city: this.city().trim() || undefined,
                countryCode: 'DE',
              }
            : undefined,
      });
      this.dialogRef.close(updated);
    } finally {
      this.submitting.set(false);
    }
  }
}
