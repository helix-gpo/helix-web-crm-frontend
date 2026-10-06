import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateEmployeeRequest, Employee, UpdateEmployeeRequest } from '../../model/access';

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

  update(id: string, request: UpdateEmployeeRequest): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  assignProject(id: string, projectId: string, tenantId: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/${id}/projects/${projectId}`, { tenantId });
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
