import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePartnerRequest,
  CreateTenantRequest,
  Partner,
  Tenant,
  UpdatePartnerRequest,
  UpdateTenantContactDetailsRequest,
  UpdateTenantCoreDetailsRequest,
  UpdateTenantNotesRequest,
} from '../../model/tenant';

@Injectable({ providedIn: 'root' })
export class TenantApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/tenants`;

  findAll(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.baseUrl);
  }

  findById(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateTenantRequest): Observable<Tenant> {
    return this.http.post<Tenant>(this.baseUrl, request);
  }

  updateContactDetails(id: string, request: UpdateTenantContactDetailsRequest): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.baseUrl}/${id}/contact-details`, request);
  }

  updateCoreDetails(tenantId: string, request: UpdateTenantCoreDetailsRequest): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.baseUrl}/${tenantId}/core-details`, request);
  }

  activate(id: string): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.baseUrl}/${id}/activate`, {});
  }

  archive(id: string): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.baseUrl}/${id}/archive`, {});
  }

  findPartners(tenantId: string): Observable<Partner[]> {
    return this.http.get<Partner[]>(`${this.baseUrl}/${tenantId}/partners`);
  }

  addPartner(tenantId: string, request: CreatePartnerRequest): Observable<Partner> {
    return this.http.post<Partner>(`${this.baseUrl}/${tenantId}/partners`, request);
  }

  updatePartner(
    tenantId: string,
    partnerId: string,
    request: UpdatePartnerRequest,
  ): Observable<Partner> {
    return this.http.patch<Partner>(`${this.baseUrl}/${tenantId}/partners/${partnerId}`, request);
  }

  removePartner(tenantId: string, partnerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${tenantId}/partners/${partnerId}`);
  }

  uploadLogo(id: string, file: File): Observable<Tenant> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Tenant>(`${this.baseUrl}/${id}/logo`, formData);
  }

  removeLogo(id: string): Observable<Tenant> {
    return this.http.delete<Tenant>(`${this.baseUrl}/${id}/logo`);
  }

  uploadPartnerPhoto(tenantId: string, partnerId: string, file: File): Observable<Partner> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Partner>(
      `${this.baseUrl}/${tenantId}/partners/${partnerId}/photo`,
      formData,
    );
  }

  removePartnerPhoto(tenantId: string, partnerId: string): Observable<Partner> {
    return this.http.delete<Partner>(`${this.baseUrl}/${tenantId}/partners/${partnerId}/photo`);
  }

  updateNotes(id: string, request: UpdateTenantNotesRequest): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.baseUrl}/${id}/notes`, request);
  }
}
