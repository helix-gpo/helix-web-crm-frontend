import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Project,
  Milestone,
  CreateProjectRequest,
  AddMilestoneRequest,
  UpdateMilestoneRequest,
  UpdateProjectRequest,
} from '../../model/project';

@Injectable({ providedIn: 'root' })
export class ProjectApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/projects`;

  findById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, request);
  }

  changeStatus(id: string, status: string): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}/status`, { status });
  }

  publish(id: string): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/${id}/publish`, {});
  }

  unpublish(id: string): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/${id}/unpublish`, {});
  }

  update(id: string, request: UpdateProjectRequest): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}`, request);
  }

  addMilestone(id: string, request: AddMilestoneRequest): Observable<Milestone> {
    return this.http.post<Milestone>(`${this.baseUrl}/${id}/milestones`, request);
  }

  updateMilestone(
    projectId: string,
    milestoneId: string,
    request: UpdateMilestoneRequest,
  ): Observable<Milestone> {
    return this.http.patch<Milestone>(
      `${this.baseUrl}/${projectId}/milestones/${milestoneId}`,
      request,
    );
  }

  changeMilestoneStatus(
    projectId: string,
    milestoneId: string,
    status: string,
  ): Observable<Milestone> {
    return this.http.patch<Milestone>(
      `${this.baseUrl}/${projectId}/milestones/${milestoneId}/status`,
      { status },
    );
  }

  removeMilestone(projectId: string, milestoneId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${projectId}/milestones/${milestoneId}`);
  }
}
