import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RoleStore } from '../../../core/access/role-store';
import { Toast } from '../../../core/toast/toast';
import { extractErrorMessage } from '../../../core/errors/error-message';
import { EntityType, PermissionAction, PermissionEntry, Role } from '../../../model/access';

export interface RoleDialogData {
  role?: Role;
}

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'TENANT', label: 'Mandanten' },
  { value: 'PROJECT', label: 'Projekte' },
  { value: 'MILESTONE', label: 'Meilensteine' },
  { value: 'INVOICE', label: 'Rechnungen' },
  { value: 'PARTNER', label: 'Ansprechpartner' },
  { value: 'TESTIMONIAL', label: 'Referenzen' },
];

const ACTIONS: { value: PermissionAction; label: string }[] = [
  { value: 'READ', label: 'Lesen' },
  { value: 'WRITE', label: 'Bearbeiten' },
  { value: 'DELETE', label: 'Löschen' },
];

@Component({
  selector: 'app-role-dialog',
  imports: [],
  templateUrl: './role-dialog.html',
  styleUrl: './role-dialog.scss',
})
export class RoleDialog {
  private readonly dialogRef = inject(MatDialogRef<RoleDialog>);
  private readonly roleStore = inject(RoleStore);
  private readonly toast = inject(Toast);
  protected readonly data = inject<RoleDialogData>(MAT_DIALOG_DATA);

  protected readonly entityTypes = ENTITY_TYPES;
  protected readonly actions = ACTIONS;
  protected readonly isEditMode = computed(() => !!this.data?.role);

  readonly name = signal(this.data?.role?.name ?? '');
  readonly description = signal(this.data?.role?.description ?? '');
  readonly unrestricted = signal(this.data?.role?.unrestricted ?? false);
  readonly permissions = signal<Set<string>>(
    new Set((this.data?.role?.permissions ?? []).map((p) => this.key(p.entity, p.action))),
  );

  readonly submitting = signal(false);
  readonly showNameWarning = signal(false);

  key(entity: EntityType, action: PermissionAction): string {
    return `${entity}:${action}`;
  }

  isChecked(entity: EntityType, action: PermissionAction): boolean {
    return this.permissions().has(this.key(entity, action));
  }

  toggle(entity: EntityType, action: PermissionAction): void {
    this.permissions.update((current) => {
      const next = new Set(current);
      const key = this.key(entity, action);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    if (!this.name().trim()) {
      this.showNameWarning.set(true);
      return;
    }

    this.submitting.set(true);

    const permissionEntries: PermissionEntry[] = Array.from(this.permissions()).map((key) => {
      const [entity, action] = key.split(':') as [EntityType, PermissionAction];
      return { entity, action };
    });

    try {
      const request = {
        name: this.name().trim(),
        description: this.description().trim() || undefined,
        unrestricted: this.unrestricted(),
        permissions: permissionEntries,
      };

      const role = this.data?.role
        ? await this.roleStore.update(this.data.role.id, request)
        : await this.roleStore.create(request);

      this.dialogRef.close(role);
    } finally {
      this.submitting.set(false);
    }
  }
}
