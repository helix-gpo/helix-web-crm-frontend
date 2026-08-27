import { Injectable, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePartnerRequest,
  CreateTenantRequest,
  Tenant,
  UpdateTenantContactDetailsRequest,
  UpdateTenantCoreDetailsRequest,
  UpdateTenantNotesRequest,
} from '../../model/tenant';
import { TenantApi } from './tenant-api';

@Injectable({ providedIn: 'root' })
export class TenantStore {
  private readonly tenantApi = inject(TenantApi);

  // Reaktive, signal-basierte Liste - lädt automatisch beim ersten Zugriff,
  // Lade-/Fehlerzustand kommt fertig aus der Resource, nichts manuell nachgeführt
  private readonly tenantsResource = httpResource<Tenant[]>(
    () => `${environment.apiBaseUrl}/tenants`,
    { defaultValue: [] },
  );

  readonly tenants = computed(() => this.tenantsResource.value() ?? []);
  readonly loading = computed(() => this.tenantsResource.isLoading());
  readonly error = computed(() =>
    this.tenantsResource.error() ? 'Mandanten konnten nicht geladen werden.' : null,
  );

  reload(): void {
    this.tenantsResource.reload();
  }

  async create(request: CreateTenantRequest, partners?: CreatePartnerRequest[]): Promise<Tenant> {
    const tenant = await firstValueFrom(this.tenantApi.create(request));

    if (partners && partners.length > 0) {
      for (const partner of partners) {
        await firstValueFrom(this.tenantApi.addPartner(tenant.id, partner));
      }
    }

    this.reload();
    return tenant;
  }

  async activate(id: string): Promise<void> {
    await firstValueFrom(this.tenantApi.activate(id));
    this.reload();
  }

  async archive(id: string): Promise<void> {
    await firstValueFrom(this.tenantApi.archive(id));
    this.reload();
  }

  async update(tenantId: string, request: UpdateTenantContactDetailsRequest): Promise<Tenant> {
    const tenant = await firstValueFrom(this.tenantApi.updateContactDetails(tenantId, request));
    this.reload();
    return tenant;
  }

  async updateNotes(tenantId: string, request: UpdateTenantNotesRequest): Promise<Tenant> {
    const tenant = await firstValueFrom(this.tenantApi.updateNotes(tenantId, request));
    this.reload();
    return tenant;
  }

  async updateCoreDetails(
    tenantId: string,
    request: UpdateTenantCoreDetailsRequest,
  ): Promise<Tenant> {
    const tenant = await firstValueFrom(this.tenantApi.updateCoreDetails(tenantId, request));
    this.reload();
    return tenant;
  }
}
