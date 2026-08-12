import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TenantStore } from '../../../core/tenants/tenant-store';
import { CreateTenantRequest, CreatePartnerRequest } from '../../../model/tenant';

@Component({
  selector: 'app-create-tenant-dialog',
  imports: [],
  templateUrl: './create-tenant-dialog.html',
  styleUrl: './create-tenant-dialog.scss',
})
export class CreateTenantDialog {
  private readonly dialogRef = inject(MatDialogRef<CreateTenantDialog>);
  private readonly tenantStore = inject(TenantStore);

  // Tenant-Felder
  readonly companyName = signal('');
  readonly legalName = signal('');
  readonly vatId = signal('');
  readonly referenceCode = signal('');
  readonly contactEmail = signal('');
  readonly contactPhone = signal('');
  readonly street = signal('');
  readonly houseNumber = signal('');
  readonly postalCode = signal('');
  readonly city = signal('');

  // Optionaler erster Partner
  readonly includePartner = signal(true);
  readonly partnerFirstName = signal('');
  readonly partnerLastName = signal('');
  readonly partnerRole = signal('');
  readonly partnerEmail = signal('');
  readonly partnerPhone = signal('');

  readonly submitting = signal(false);
  readonly showCompanyNameWarning = signal(false);

  readonly isValid = computed(() => this.companyName().trim().length > 0);

  close(): void {
    this.dialogRef.close();
  }

  onCompanyNameBlur(): void {
    // Nur vorschlagen, wenn User das Kürzel noch nicht selbst editiert hat
    if (this.referenceCode().trim()) return;
    const initials = this.companyName()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
    this.referenceCode.set(initials);
  }

  async submit(): Promise<void> {
    if (!this.isValid()) {
      this.showCompanyNameWarning.set(true);
      return;
    }

    this.submitting.set(true);

    const request: CreateTenantRequest = {
      companyName: this.companyName().trim(),
      legalName: this.legalName().trim() || undefined,
      vatId: this.vatId().trim() || undefined,
      referenceCode: this.referenceCode().trim().toUpperCase() || undefined,
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
    };

    let partner: CreatePartnerRequest | undefined;
    if (this.includePartner() && this.partnerFirstName().trim() && this.partnerLastName().trim()) {
      partner = {
        firstName: this.partnerFirstName().trim(),
        lastName: this.partnerLastName().trim(),
        role: this.partnerRole().trim() || undefined,
        email: this.partnerEmail().trim() || undefined,
        phone: this.partnerPhone().trim() || undefined,
      };
    }

    try {
      const tenant = await this.tenantStore.create(request, partner);
      this.dialogRef.close(tenant);
    } finally {
      this.submitting.set(false);
    }
  }
}
