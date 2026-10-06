import { Component, computed, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { EmployeeStore } from '../../../core/access/employee-store';
import { RoleStore } from '../../../core/access/role-store';
import { Toast } from '../../../core/toast/toast';
import { ConfirmDialog } from '../../../util/confirm-dialog/confirm-dialog';
import { Employee } from '../../../model/access';

export interface EditEmployeeDialogData {
  employee: Employee;
}

@Component({
  selector: 'app-edit-employee-dialog',
  imports: [MatDialogModule],
  templateUrl: './edit-employee-dialog.html',
  styleUrl: './edit-employee-dialog.scss',
})
export class EditEmployeeDialog {
  private readonly dialogRef = inject(MatDialogRef<EditEmployeeDialog>);
  private readonly employeeStore = inject(EmployeeStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);

  protected readonly roleStore = inject(RoleStore);
  protected readonly data = inject<EditEmployeeDialogData>(MAT_DIALOG_DATA);

  readonly firstName = signal(this.data.employee.firstName);
  readonly lastName = signal(this.data.employee.lastName);
  readonly roleId = signal(this.data.employee.role.id);

  readonly submitting = signal(false);
  readonly showWarning = signal(false);

  readonly isValid = computed(
    () => this.firstName().trim().length > 0 && this.lastName().trim().length > 0,
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
      const employee = await this.employeeStore.update(this.data.employee.id, {
        firstName: this.firstName().trim(),
        lastName: this.lastName().trim(),
        roleId: this.roleId(),
      });
      this.dialogRef.close(employee);
    } finally {
      this.submitting.set(false);
    }
  }

  async toggleActive(): Promise<void> {
    const employee = this.data.employee;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '48rem',
      panelClass: 'app-dialog-panel',
      data: employee.active
        ? {
            title: 'Zugang sperren?',
            message: `${employee.firstName} ${employee.lastName} (${employee.email}) kann sich danach nicht mehr einloggen. Dein Zugang bleibt mit allen Daten erhalten und lässt sich jederzeit wieder aktivieren.`,
            confirmLabel: 'Zugang sperren',
            danger: true,
          }
        : {
            title: 'Zugang aktivieren?',
            message: `${employee.firstName} ${employee.lastName} kann sich danach wieder mit dem bisherigen Passwort einloggen. Nur falls der Zugang früher komplett gelöscht wurde, wird ein neuer angelegt und eine Einladungsmail an ${employee.email} verschickt.`,
            confirmLabel: 'Zugang aktivieren',
            danger: false,
          },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) {
      return;
    }

    const updated = employee.active
      ? await this.employeeStore.deactivate(employee.id)
      : await this.employeeStore.activate(employee.id);

    this.toast.success(updated.active ? 'Zugang aktiviert' : 'Zugang deaktiviert');
    this.dialogRef.close(updated);
  }

  async deleteEmployee(): Promise<void> {
    const employee = this.data.employee;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '48rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Mitarbeiter endgültig löschen?',
        message: `${employee.firstName} ${employee.lastName} (${employee.email}) wird unwiderruflich gelöscht - inklusive Cognito-Zugang und aller Projekt-Zuweisungen. Das kann nicht rückgängig gemacht werden.`,
        confirmLabel: 'Endgültig löschen',
        danger: true,
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) {
      return;
    }

    await this.employeeStore.delete(employee.id);
    this.toast.success(`${employee.firstName} ${employee.lastName} gelöscht`);
    this.dialogRef.close(true);
  }
}
