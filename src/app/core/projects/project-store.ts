import { Injectable, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, CreateProjectRequest } from '../../model/project';
import { ProjectApi } from './project-api';

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly projectApi = inject(ProjectApi);

  private readonly projectsResource = httpResource<Project[]>(
    () => `${environment.apiBaseUrl}/projects`,
    { defaultValue: [] },
  );

  readonly projects = computed(() => this.projectsResource.value() ?? []);
  readonly loading = computed(() => this.projectsResource.isLoading());
  readonly error = computed(() =>
    this.projectsResource.error() ? 'Projekte konnten nicht geladen werden.' : null,
  );

  reload(): void {
    this.projectsResource.reload();
  }

  async create(request: CreateProjectRequest): Promise<Project> {
    const project = await firstValueFrom(this.projectApi.create(request));
    this.reload();
    return project;
  }
}
