import { Injectable, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRoleRequest, Role, UpdateRoleRequest } from '../../model/access';
import { RoleApi } from './role-api';

@Injectable({ providedIn: 'root' })
export class RoleStore {
  private readonly roleApi = inject(RoleApi);

  private readonly rolesResource = httpResource<Role[]>(() => `${environment.apiBaseUrl}/roles`, {
    defaultValue: [],
  });

  readonly roles = this.rolesResource.value;
  readonly loading = this.rolesResource.isLoading;
  readonly error = this.rolesResource.error;

  reload(): void {
    this.rolesResource.reload();
  }

  async create(request: CreateRoleRequest): Promise<Role> {
    const role = await firstValueFrom(this.roleApi.create(request));
    this.reload();
    return role;
  }

  async update(id: string, request: UpdateRoleRequest): Promise<Role> {
    const role = await firstValueFrom(this.roleApi.update(id, request));
    this.reload();
    return role;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.roleApi.delete(id));
    this.reload();
  }
}
