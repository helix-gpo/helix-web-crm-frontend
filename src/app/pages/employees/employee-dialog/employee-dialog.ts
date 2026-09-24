import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { EmployeeStore } from '../../../core/access/employee-store';
import { RoleStore } from '../../../core/access/role-store';

@Component({
  selector: 'app-employee-dialog',
  imports: [],
  templateUrl: './employee-dialog.html',
  styleUrl: './employee-dialog.scss',
})
export class EmployeeDialog {
  private readonly dialogRef = inject(MatDialogRef<EmployeeDialog>);
  private readonly employeeStore = inject(EmployeeStore);
  protected readonly roleStore = inject(RoleStore);

  readonly email = signal('');
  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly roleId = signal('');

  readonly submitting = signal(false);
  readonly showWarning = signal(false);

  readonly isValid = computed(
    () =>
      this.email().trim().length > 0 &&
      this.firstName().trim().length > 0 &&
      this.lastName().trim().length > 0 &&
      this.roleId().length > 0,
  );

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    if (!this.isValid()) {
      this.showWarning.set(true);
      return;
    }

    this.submitting.set(true);

    try {
      const employee = await this.employeeStore.create({
        email: this.email().trim(),
        firstName: this.firstName().trim(),
        lastName: this.lastName().trim(),
        roleId: this.roleId(),
      });
      this.dialogRef.close(employee);
    } finally {
      this.submitting.set(false);
    }
  }
}
