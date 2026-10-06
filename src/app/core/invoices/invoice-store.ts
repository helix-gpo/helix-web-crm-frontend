import { Injectable, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateInvoiceRequest, Invoice } from '../../model/invoice';
import { InvoiceApi } from './invoice-api';
import { Permissions } from '../access/permissions';

@Injectable({ providedIn: 'root' })
export class InvoiceStore {
  private readonly invoiceApi = inject(InvoiceApi);
  private readonly permissions = inject(Permissions);

  private readonly invoicesResource = httpResource<Invoice[]>(
    () => (this.permissions.can('INVOICE:READ') ? `${environment.apiBaseUrl}/invoices` : undefined),
    { defaultValue: [] },
  );

  readonly invoices = computed(() =>
    this.invoicesResource.hasValue() ? this.invoicesResource.value() : [],
  );
  readonly loading = computed(
    () => !this.permissions.loaded() || this.invoicesResource.isLoading(),
  );

  readonly error = computed(() =>
    this.invoicesResource.error() ? 'Rechnungen konnten nicht geladen werden.' : null,
  );

  reload(): void {
    this.invoicesResource.reload();
  }

  async create(request: CreateInvoiceRequest): Promise<Invoice> {
    const invoice = await firstValueFrom(this.invoiceApi.create(request));
    this.reload();
    return invoice;
  }
}
