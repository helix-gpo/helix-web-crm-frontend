import { Injectable, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Invoice } from '../../model/invoice';

@Injectable({ providedIn: 'root' })
export class InvoiceStore {
  private readonly invoicesResource = httpResource<Invoice[]>(
    () => `${environment.apiBaseUrl}/invoices`,
    { defaultValue: [] },
  );

  readonly invoices = computed(() => this.invoicesResource.value() ?? []);
  readonly loading = computed(() => this.invoicesResource.isLoading());

  reload(): void {
    this.invoicesResource.reload();
  }
}
