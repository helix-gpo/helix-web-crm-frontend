import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInvoiceRequest,
  Invoice,
  InvoicePrefill,
  IssueInvoiceRequest,
  LineItemRequest,
} from '../../model/invoice';

@Injectable({ providedIn: 'root' })
export class InvoiceApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/invoices`;

  findById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.baseUrl}/${id}`);
  }

  // projectId ist bei uns Pflicht (siehe Roadmap-Entscheidung), aber am
  // Endpunkt weiterhin optional übergeben - Backend erlaubt beides
  prefill(tenantId: string, projectId?: string): Observable<InvoicePrefill> {
    let url = `${this.baseUrl}/prefill?tenantId=${tenantId}`;
    if (projectId) url += `&projectId=${projectId}`;
    return this.http.get<InvoicePrefill>(url);
  }

  create(request: CreateInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(this.baseUrl, request);
  }

  addLineItem(invoiceId: string, request: LineItemRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.baseUrl}/${invoiceId}/line-items`, request);
  }

  removeLineItem(invoiceId: string, lineItemId: string): Observable<Invoice> {
    return this.http.delete<Invoice>(`${this.baseUrl}/${invoiceId}/line-items/${lineItemId}`);
  }

  issue(invoiceId: string, request?: IssueInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.baseUrl}/${invoiceId}/issue`, request ?? {});
  }
}
