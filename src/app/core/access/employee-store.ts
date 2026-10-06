import { Injectable, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest,
} from '../../model/access';
import { EmployeeApi } from './employee-api';

@Injectable({ providedIn: 'root' })
export class EmployeeStore {
  private readonly employeeApi = inject(EmployeeApi);

  private readonly employeesResource = httpResource<Employee[]>(
    () => `${environment.apiBaseUrl}/employees`,
    { defaultValue: [] },
  );

  readonly employees = this.employeesResource.value;
  readonly loading = this.employeesResource.isLoading;
  readonly error = this.employeesResource.error;

  reload(): void {
    this.employeesResource.reload();
  }

  async create(request: CreateEmployeeRequest): Promise<Employee> {
    const employee = await firstValueFrom(this.employeeApi.create(request));
    this.reload();
    return employee;
  }

  async update(id: string, request: UpdateEmployeeRequest): Promise<Employee> {
    const employee = await firstValueFrom(this.employeeApi.update(id, request));
    this.reload();
    return employee;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.employeeApi.delete(id));
    this.reload();
  }

  async assignProject(id: string, projectId: string, tenantId: string): Promise<Employee> {
    const employee = await firstValueFrom(this.employeeApi.assignProject(id, projectId, tenantId));
    this.reload();
    return employee;
  }

  async unassignProject(id: string, projectId: string): Promise<Employee> {
    const employee = await firstValueFrom(this.employeeApi.unassignProject(id, projectId));
    this.reload();
    return employee;
  }

  async deactivate(id: string): Promise<Employee> {
    const employee = await firstValueFrom(this.employeeApi.deactivate(id));
    this.reload();
    return employee;
  }

  async activate(id: string): Promise<Employee> {
    const employee = await firstValueFrom(this.employeeApi.activate(id));
    this.reload();
    return employee;
  }
}
