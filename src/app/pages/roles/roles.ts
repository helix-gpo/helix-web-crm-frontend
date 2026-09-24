import { Component, inject, computed } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { RoleStore } from '../../core/access/role-store';
import { Toast } from '../../core/toast/toast';
import { ConfirmDialog } from '../../util/confirm-dialog/confirm-dialog';
import { RoleDialog } from './role-dialog/role-dialog';
import { EntityType, PermissionAction, Role } from '../../model/access';

@Component({
  selector: 'app-roles',
  imports: [MatDialogModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class Roles {
  protected readonly roleStore = inject(RoleStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);

  private readonly entityLabels: Record<EntityType, string> = {
    TENANT: 'Mandanten',
    PROJECT: 'Projekte',
    MILESTONE: 'Meilensteine',
    INVOICE: 'Rechnungen',
    PARTNER: 'Ansprechpartner',
    TESTIMONIAL: 'Referenzen',
  };

  private readonly actionLabels: Record<PermissionAction, string> = {
    READ: 'Lesen',
    WRITE: 'Bearbeiten',
    DELETE: 'Löschen',
  };

  protected readonly sortedRoles = computed(() =>
    [...this.roleStore.roles()].sort((a, b) => {
      if (a.unrestricted !== b.unrestricted) {
        return a.unrestricted ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'de');
    }),
  );

  protected roleIcon(role: Role): string {
    return role.unrestricted ? 'shield_person' : 'assignment_ind';
  }

  protected groupedPermissions(
    role: Role,
  ): { action: PermissionAction; label: string; entities: string }[] {
    const order: PermissionAction[] = ['READ', 'WRITE', 'DELETE'];

    return order
      .map((action) => ({
        action,
        label: this.actionLabels[action],
        entities: role.permissions
          .filter((p) => p.action === action)
          .map((p) => this.entityLabels[p.entity])
          .join(', '),
      }))
      .filter((group) => group.entities.length > 0);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(RoleDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Rolle angelegt');
    });
  }

  openEditDialog(role: Role): void {
    const dialogRef = this.dialog.open(RoleDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
      data: { role },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Rolle aktualisiert');
    });
  }

  async deleteRole(role: Role): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '44rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Rolle löschen?',
        message: `"${role.name}" wird unwiderruflich gelöscht. Mitarbeiter mit dieser Rolle müssen vorher einer anderen Rolle zugewiesen werden.`,
        confirmLabel: 'Löschen',
        danger: true,
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      await this.roleStore.delete(role.id);
      this.toast.success(`${role.name} gelöscht`);
    }
  }
}
