import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TenantStore } from '../../../core/tenants/tenant-store';
import { CreateTenantRequest, CreatePartnerRequest } from '../../../model/tenant';

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

  // Optionale Partner - beliebig viele
  readonly includePartner = signal(false);
  readonly partners = signal<PartnerDraft[]>([emptyPartnerDraft()]);

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

    // Nur Zeilen mit ausgefülltem Vor- und Nachnamen wirklich anlegen -
    // leere Zusatzzeilen (z.B. durch versehentliches Plus-Klicken) werden ignoriert
    const partners: CreatePartnerRequest[] = this.includePartner()
      ? this.partners()
          .filter((p) => p.firstName.trim() && p.lastName.trim())
          .map((p) => ({
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            role: p.role.trim() || undefined,
            email: p.email.trim() || undefined,
            phone: p.phone.trim() || undefined,
          }))
      : [];

    try {
      const tenant = await this.tenantStore.create(request, partners);
      this.dialogRef.close(tenant);
    } finally {
      this.submitting.set(false);
    }
  }
}
