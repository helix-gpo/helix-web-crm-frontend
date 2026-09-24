import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EmployeeStore } from '../../../core/access/employee-store';
import { RoleStore } from '../../../core/access/role-store';
import { Employee } from '../../../model/access';

export interface ChangeRoleDialogData {
  employee: Employee;
}

@Component({
  selector: 'app-change-role-dialog',
  imports: [],
  templateUrl: './change-role-dialog.html',
  styleUrl: './change-role-dialog.scss',
})
export class ChangeRoleDialog {
  private readonly dialogRef = inject(MatDialogRef<ChangeRoleDialog>);
  private readonly employeeStore = inject(EmployeeStore);
  protected readonly roleStore = inject(RoleStore);
  protected readonly data = inject<ChangeRoleDialogData>(MAT_DIALOG_DATA);

  readonly roleId = signal(this.data.employee.role.id);
  readonly submitting = signal(false);

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    this.submitting.set(true);

    try {
      const employee = await this.employeeStore.updateRole(this.data.employee.id, {
        roleId: this.roleId(),
      });
      this.dialogRef.close(employee);
    } finally {
      this.submitting.set(false);
    }
  }
}
