import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProjectStore } from '../../../core/projects/project-store';
import { TenantStore } from '../../../core/tenants/tenant-store';
import { EmployeeStore } from '../../../core/access/employee-store';
import { Employee } from '../../../model/access';

export interface AssignProjectsDialogData {
  employee: Employee;
}

@Component({
  selector: 'app-assign-projects-dialog',
  imports: [],
  templateUrl: './assign-projects-dialog.html',
  styleUrl: './assign-projects-dialog.scss',
})
export class AssignProjectsDialog {
  private readonly dialogRef = inject(MatDialogRef<AssignProjectsDialog>);
  private readonly projectStore = inject(ProjectStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly employeeStore = inject(EmployeeStore);

  protected readonly data = inject<AssignProjectsDialogData>(MAT_DIALOG_DATA);

  readonly selected = signal<Set<string>>(new Set(this.data.employee.assignedProjectIds));
  readonly submitting = signal(false);

  protected readonly groupedProjects = computed(() => {
    const projects = this.projectStore.projects();

    return this.tenantStore
      .tenants()
      .map((tenant) => ({
        tenant,
        projects: projects.filter((p) => p.tenantId === tenant.id),
      }))
      .filter((group) => group.projects.length > 0);
  });

  isChecked(projectId: string): boolean {
    return this.selected().has(projectId);
  }

  toggle(projectId: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    this.submitting.set(true);

    const before = new Set(this.data.employee.assignedProjectIds);
    const after = this.selected();

    const toAdd = [...after].filter((id) => !before.has(id));
    const toRemove = [...before].filter((id) => !after.has(id));

    try {
      for (const projectId of toAdd) {
        await this.employeeStore.assignProject(this.data.employee.id, projectId);
      }
      for (const projectId of toRemove) {
        await this.employeeStore.unassignProject(this.data.employee.id, projectId);
      }
      this.dialogRef.close(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
