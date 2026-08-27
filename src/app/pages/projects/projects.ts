import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';
import { ProjectStore } from '../../core/projects/project-store';
import { ProjectApi } from '../../core/projects/project-api';
import { TenantStore } from '../../core/tenants/tenant-store';
import { Toast } from '../../core/toast/toast';
import { ConfirmDialog } from '../../util/confirm-dialog/confirm-dialog';
import { CreateProjectDialog } from './create-project-dialog/create-project-dialog';
import { getContrastTextColor } from '../../util/color-contrast';
import { Project, ProjectStatus } from '../../model/project';
import { SortableHeader } from '../../shared/sortable-header/sortable-header';
import {
  FilterDialog,
  FilterFieldConfig,
  ActiveFilters,
} from '../../shared/filter-dialog/filter-dialog';
import { cycleSort, sortByKey, SortState, SortDirection } from '../../util/sortable/sortable';

type ViewMode = 'kanban' | 'list';
type ProjectSortKey = 'title' | 'tenantName' | 'status';

@Component({
  selector: 'app-projects',
  imports: [MatDialogModule, MatMenuModule, MatDividerModule, SortableHeader],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  protected readonly projectStore = inject(ProjectStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly projectApi = inject(ProjectApi);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  protected readonly getContrastTextColor = getContrastTextColor;

  readonly viewMode = signal<ViewMode>('list');
  readonly searchTerm = signal('');
  readonly sort = signal<SortState<ProjectSortKey>>({ key: null, direction: null });
  readonly activeFilters = signal<ActiveFilters>({});

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

  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: this.columns.map((c) => ({ value: c.status, label: c.label })),
    },
    {
      key: 'visibleOnWebsite',
      label: 'Website-Sichtbarkeit',
      options: [
        { value: 'true', label: 'Sichtbar' },
        { value: 'false', label: 'Nicht sichtbar' },
      ],
    },
  ];

  readonly activeFilterCount = computed(() =>
    Object.values(this.activeFilters()).reduce((sum, values) => sum + values.length, 0),
  );

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
    let projects = this.projectStore.projects();

    if (term) {
      projects = projects.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          this.tenantName(p.tenantId).toLowerCase().includes(term),
      );
    }

    const filters = this.activeFilters();

    if (filters['status']?.length) {
      projects = projects.filter((p) => filters['status'].includes(p.status));
    }
    if (filters['visibleOnWebsite']?.length) {
      projects = projects.filter((p) =>
        filters['visibleOnWebsite'].includes(String(p.visibleOnWebsite)),
      );
    }

    return sortByKey(projects, this.sort(), (p, key) => {
      switch (key) {
        case 'title':
          return p.title;
        case 'tenantName':
          return this.tenantName(p.tenantId);
        case 'status':
          return p.status;
      }
    });
  });

  toggleSort(key: ProjectSortKey): void {
    this.sort.update((current) => cycleSort(current, key));
  }

  sortDirectionFor(key: ProjectSortKey): SortDirection {
    const s = this.sort();
    return s.key === key ? s.direction : null;
  }

  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterDialog, {
      width: '48rem',
      panelClass: 'app-dialog-panel',
      data: { fields: this.filterFields, active: this.activeFilters() },
    });

    dialogRef.afterClosed().subscribe((result?: ActiveFilters) => {
      if (result) this.activeFilters.set(result);
    });
  }

  tenantName(tenantId: string): string {
    return this.tenantNameById().get(tenantId) ?? 'Unbekannt';
  }

  completedMilestones(project: Project): number {
    return project.milestones.filter((m) => m.status === 'DONE').length;
  }

  openProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  openCreateDialog(initialStatus?: ProjectStatus): void {
    const dialogRef = this.dialog.open(CreateProjectDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
      data: { initialStatus },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Projekt angelegt');
    });
  }

  async togglePublish(project: Project): Promise<void> {
    const call = project.visibleOnWebsite
      ? this.projectApi.unpublish(project.id)
      : this.projectApi.publish(project.id);
    await firstValueFrom(call);
    this.projectStore.reload();
    this.toast.success(
      project.visibleOnWebsite ? 'Von Website entfernt' : 'Auf Website veröffentlicht',
    );
  }

  async cancelProject(project: Project): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '44rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Projekt abbrechen?',
        message: `"${project.title}" wird auf "Abgebrochen" gesetzt und verschwindet aus dem aktiven Board. Die Historie (Meilensteine, Rechnungen) bleibt erhalten.`,
        confirmLabel: 'Abbrechen setzen',
        danger: true,
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      await firstValueFrom(this.projectApi.changeStatus(project.id, 'CANCELLED'));
      this.projectStore.reload();
      this.toast.success(`${project.title} abgebrochen`);
    }
  }
}
