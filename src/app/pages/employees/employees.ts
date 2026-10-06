import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EmployeeStore } from '../../core/access/employee-store';
import { Toast } from '../../core/toast/toast';
import { Avatar } from '../../util/avatar/avatar';
import { Employee } from '../../model/access';
import { EmployeeDialog } from './employee-dialog/employee-dialog';
import { AssignProjectsDialog } from './assign-projects-dialog/assign-projects-dialog';
import { ProjectStore } from '../../core/projects/project-store';
import { EditEmployeeDialog } from './edit-employee-dialog/edit-employee-dialog';

@Component({
  selector: 'app-employees',
  imports: [Avatar, MatMenuModule, MatDividerModule, MatDialogModule],
  templateUrl: './employees.html',
  styleUrl: './employees.scss',
})
export class Employees {
  protected readonly employeeStore = inject(EmployeeStore);
  protected readonly projectStore = inject(ProjectStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);

  protected effectiveProjectCount(employee: Employee): number {
    const selfCreatedIds = this.projectStore
      .projects()
      .filter((p) => p.createdBy === employee.email)
      .map((p) => p.id);

    return new Set([...employee.assignedProjectIds, ...selfCreatedIds]).size;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(EmployeeDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Mitarbeiter eingeladen');
    });
  }

  openAssignProjectsDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(AssignProjectsDialog, {
      width: '56rem',
      panelClass: 'app-dialog-panel',
      data: { employee },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Projekt-Zuweisung aktualisiert');
    });
  }

  openEditDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(EditEmployeeDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: { employee },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Mitarbeiter aktualisiert');
    });
  }
}
