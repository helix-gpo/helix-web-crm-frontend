import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { TenantApi } from '../../../core/tenants/tenant-api';
import { Partner } from '../../../model/tenant';

export interface PartnerDialogData {
  tenantId: string;
  partner?: Partner; // gesetzt = Bearbeiten-Modus, undefined = Anlegen-Modus
}

@Component({
  selector: 'app-partner-dialog',
  imports: [],
  templateUrl: './partner-dialog.html',
  styleUrl: './partner-dialog.scss',
})
export class PartnerDialog {
  private readonly dialogRef = inject(MatDialogRef<PartnerDialog>);
  private readonly tenantApi = inject(TenantApi);
  protected readonly data = inject<PartnerDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = computed(() => !!this.data.partner);

  readonly firstName = signal(this.data.partner?.firstName ?? '');
  readonly lastName = signal(this.data.partner?.lastName ?? '');
  readonly role = signal(this.data.partner?.role ?? '');
  readonly email = signal(this.data.partner?.email ?? '');
  readonly phone = signal(this.data.partner?.phone ?? '');

  readonly submitting = signal(false);
  readonly showNameWarning = signal(false);

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    if (!this.firstName().trim() || !this.lastName().trim()) {
      this.showNameWarning.set(true);
      return;
    }

    this.submitting.set(true);

    const request = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      role: this.role().trim() || undefined,
      email: this.email().trim() || undefined,
      phone: this.phone().trim() || undefined,
    };

    try {
      const result = this.isEditMode()
        ? await firstValueFrom(
            this.tenantApi.updatePartner(this.data.tenantId, this.data.partner!.id, request),
          )
        : await firstValueFrom(this.tenantApi.addPartner(this.data.tenantId, request));

      this.dialogRef.close(result);
    } finally {
      this.submitting.set(false);
    }
  }
}
