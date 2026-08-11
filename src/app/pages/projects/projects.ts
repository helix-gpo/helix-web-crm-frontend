import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { firstValueFrom } from 'rxjs';
import { ProjectStore } from '../../core/projects/project-store';
import { ProjectApi } from '../../core/projects/project-api';
import { TenantStore } from '../../core/tenants/tenant-store';
import { CreateProjectDialog } from './create-project-dialog/create-project-dialog';
import { Project, ProjectStatus } from '../../model/project';

type ViewMode = 'kanban' | 'list';

@Component({
  selector: 'app-projects',
  imports: [MatDialogModule, MatMenuModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  protected readonly projectStore = inject(ProjectStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly projectApi = inject(ProjectApi);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly viewMode = signal<ViewMode>('list');
  readonly searchTerm = signal('');
  readonly statusFilter = signal<ProjectStatus | 'ALL'>('ALL');

  readonly columns: { status: ProjectStatus; label: string }[] = [
    { status: 'LEAD', label: 'Interessent' },
    { status: 'IN_PROGRESS', label: 'In Arbeit' },
    { status: 'ON_HOLD', label: 'Pausiert' },
    { status: 'COMPLETED', label: 'Abgeschlossen' },
    { status: 'CANCELLED', label: 'Abgebrochen' },
  ];

  readonly statusLabels: Record<ProjectStatus, string> = {
    LEAD: 'Interessent',
    IN_PROGRESS: 'In Arbeit',
    ON_HOLD: 'Pausiert',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Abgebrochen',
  };

  private readonly tenantNameById = computed(() => {
    const map = new Map<string, string>();
    this.tenantStore.tenants().forEach((t) => map.set(t.id, t.companyName));
    return map;
  });

  readonly groupedProjects = computed(() => {
    const grouped: Record<ProjectStatus, Project[]> = {
      LEAD: [],
      IN_PROGRESS: [],
      ON_HOLD: [],
      COMPLETED: [],
      CANCELLED: [],
    };
    this.projectStore.projects().forEach((p) => grouped[p.status].push(p));
    return grouped;
  });

  readonly filteredListProjects = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    return this.projectStore.projects().filter((p) => {
      const matchesStatus = status === 'ALL' || p.status === status;
      const matchesSearch =
        !term ||
        p.title.toLowerCase().includes(term) ||
        this.tenantName(p.tenantId).toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  });

  tenantName(tenantId: string): string {
    return this.tenantNameById().get(tenantId) ?? 'Unbekannt';
  }

  completedMilestones(project: Project): number {
    return project.milestones.filter((m) => m.status === 'DONE').length;
  }

  openProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  openCreateDialog(): void {
    this.dialog.open(CreateProjectDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
    });
  }

  async togglePublish(project: Project): Promise<void> {
    const call = project.visibleOnWebsite
      ? this.projectApi.unpublish(project.id)
      : this.projectApi.publish(project.id);
    await firstValueFrom(call);
    this.projectStore.reload();
  }
}
