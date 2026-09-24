import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateEmployeeRequest, Employee, UpdateEmployeeRoleRequest } from '../../model/access';

@Injectable({ providedIn: 'root' })
export class EmployeeApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/employees`;

  findAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.baseUrl);
  }

  findById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, request);
  }

  updateRole(id: string, request: UpdateEmployeeRoleRequest): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/${id}/role`, request);
  }

  assignProject(id: string, projectId: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/${id}/projects/${projectId}`, {});
  }

  unassignProject(id: string, projectId: string): Observable<Employee> {
    return this.http.delete<Employee>(`${this.baseUrl}/${id}/projects/${projectId}`);
  }

  deactivate(id: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  activate(id: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/${id}/activate`, {});
  }
}
