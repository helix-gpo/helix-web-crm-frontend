import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRoleRequest, Role, UpdateRoleRequest } from '../../model/access';

@Injectable({ providedIn: 'root' })
export class RoleApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/roles`;

  findAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.baseUrl);
  }

  findById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, request);
  }

  update(id: string, request: UpdateRoleRequest): Observable<Role> {
    return this.http.patch<Role>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
