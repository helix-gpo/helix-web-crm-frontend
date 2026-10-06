import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RoleStore } from '../../../core/access/role-store';
import {
  EntityType,
  PermissionAction,
  PermissionEntry,
  PermissionKey,
  Role,
} from '../../../model/access';
import { ACTION_LABELS, ENTITY_LABELS } from '../../../model/access-labels';
import { describeKey, findMissingPermissions } from './permission-dependencies';

export interface RoleDialogData {
  role?: Role;
}

@Component({
  selector: 'app-role-dialog',
  imports: [],
  templateUrl: './role-dialog.html',
  styleUrl: './role-dialog.scss',
})
export class RoleDialog {
  private readonly dialogRef = inject(MatDialogRef<RoleDialog>);
  private readonly roleStore = inject(RoleStore);
  protected readonly data = inject<RoleDialogData>(MAT_DIALOG_DATA);

  protected readonly entityTypes = (Object.keys(ENTITY_LABELS) as EntityType[]).map((value) => ({
    value,
    label: ENTITY_LABELS[value],
  }));
  protected readonly actions = (Object.keys(ACTION_LABELS) as PermissionAction[]).map((value) => ({
    value,
    label: ACTION_LABELS[value],
  }));
  protected readonly isEditMode = computed(() => !!this.data?.role);

  readonly name = signal(this.data?.role?.name ?? '');
  readonly description = signal(this.data?.role?.description ?? '');
  readonly unrestricted = signal(this.data?.role?.unrestricted ?? false);
  readonly permissions = signal<Set<PermissionKey>>(
    new Set((this.data?.role?.permissions ?? []).map((p) => this.key(p.entity, p.action))),
  );

  readonly submitting = signal(false);
  readonly showNameWarning = signal(false);

  protected readonly missing = computed(() => {
    if (this.unrestricted()) {
      return [];
    }
    return [...findMissingPermissions(this.permissions()).entries()].map(([key, reasons]) => ({
      key,
      label: describeKey(key),
      reasons,
    }));
  });

  private readonly missingKeys = computed(() => new Set(this.missing().map((item) => item.key)));

  key(entity: EntityType, action: PermissionAction): PermissionKey {
    return `${entity}:${action}`;
  }

  isChecked(entity: EntityType, action: PermissionAction): boolean {
    return this.permissions().has(this.key(entity, action));
  }

  isMissing(entity: EntityType, action: PermissionAction): boolean {
    return this.missingKeys().has(this.key(entity, action));
  }

  toggle(entity: EntityType, action: PermissionAction): void {
    this.permissions.update((current) => {
      const next = new Set(current);
      const key = this.key(entity, action);

      if (next.has(key)) {
        next.delete(key);
        if (action === 'READ') {
          next.delete(this.key(entity, 'WRITE'));
          next.delete(this.key(entity, 'DELETE'));
        }
      } else {
        next.add(key);
        if (action !== 'READ') {
          next.add(this.key(entity, 'READ'));
        }
      }
      return next;
    });
  }

  addPermission(key: PermissionKey): void {
    this.permissions.update((current) => new Set(current).add(key));
  }

  addAllMissing(): void {
    this.permissions.update((current) => {
      const next = new Set(current);
      this.missing().forEach((item) => next.add(item.key));
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
