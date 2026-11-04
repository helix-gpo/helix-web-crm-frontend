import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TenantStore } from '../../../core/tenants/tenant-store';
import { CreateTenantRequest } from '../../../model/tenant';
import { isValidEmail } from '../../../util/validation/email';

interface PartnerDraft {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
}

function emptyPartnerDraft(): PartnerDraft {
  return { firstName: '', lastName: '', role: '', email: '', phone: '' };
}

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

  readonly showPartnerNameWarning = signal(false);
  readonly showCompanyNameWarning = signal(false);
  readonly showReferenceCodeWarning = signal(false);

  readonly showContactEmailError = signal(false);
  readonly showPartnerEmailError = signal(false);

  // Optionale Partner - beliebig viele
  readonly includePartner = signal(false);
  readonly partners = signal<PartnerDraft[]>([emptyPartnerDraft()]);

  readonly submitting = signal(false);

  readonly isValid = computed(
    () => this.companyName().trim().length > 0 && this.referenceCode().trim().length > 0,
  );

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

  updatePartnerField(index: number, field: keyof PartnerDraft, value: string): void {
    this.partners.update((list) =>
      list.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  addPartnerRow(): void {
    this.partners.update((list) => [...list, emptyPartnerDraft()]);
  }

  removePartnerRow(index: number): void {
    this.partners.update((list) => (list.length > 1 ? list.filter((_, i) => i !== index) : list));
  }

  async submit(): Promise<void> {
    if (!this.isValid()) {
      this.showCompanyNameWarning.set(this.companyName().trim().length === 0);
      this.showReferenceCodeWarning.set(this.referenceCode().trim().length === 0);
      return;
    }

    // rows with any input count as intended - they need first and last name
    const filledRows = this.includePartner()
      ? this.partners().filter((p) => Object.values(p).some((v) => v.trim()))
      : [];
    const incomplete = filledRows.some((p) => !p.firstName.trim() || !p.lastName.trim());
    this.showPartnerNameWarning.set(incomplete);
    if (incomplete) {
      return;
    }

    const contactEmailInvalid = !isValidEmail(this.contactEmail());
    const partnerEmailInvalid = filledRows.some((p) => !isValidEmail(p.email));
    this.showContactEmailError.set(contactEmailInvalid);
    this.showPartnerEmailError.set(partnerEmailInvalid);
    if (contactEmailInvalid || partnerEmailInvalid) {
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
      partners: filledRows.map((p) => ({
        firstName: p.firstName.trim(),
        lastName: p.lastName.trim(),
        role: p.role.trim() || undefined,
        email: p.email.trim() || undefined,
        phone: p.phone.trim() || undefined,
      })),
    };

    try {
      const tenant = await this.tenantStore.create(request);
      this.dialogRef.close(tenant);
    } finally {
      this.submitting.set(false);
    }
  }
}
