import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ProjectStore } from '../../../core/projects/project-store';
import { ProjectApi } from '../../../core/projects/project-api';
import { TenantStore } from '../../../core/tenants/tenant-store';
import { Toast } from '../../../core/toast/toast';
import { extractErrorMessage } from '../../../core/errors/error-message';

const MAX_ON_WEBSITE = 6;

@Component({
  selector: 'app-add-project-dialog',
  imports: [],
  templateUrl: './add-project-dialog.html',
  styleUrl: './add-project-dialog.scss',
})
export class AddProjectDialog {
  private readonly dialogRef = inject(MatDialogRef<AddProjectDialog>);
  protected readonly projectStore = inject(ProjectStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly projectApi = inject(ProjectApi);
  private readonly toast = inject(Toast);

  readonly processingId = signal<string | null>(null);

  private readonly tenantNameById = computed(() => {
    const map = new Map<string, string>();
    this.tenantStore.tenants().forEach((t) => map.set(t.id, t.companyName));
    return map;
  });

  tenantName(tenantId: string): string {
    return this.tenantNameById().get(tenantId) ?? 'Unbekannt';
  }

  readonly eligibleProjects = computed(() =>
    this.projectStore.projects().filter((p) => !p.visibleOnWebsite),
  );

  readonly slotsFull = computed(
    () => this.projectStore.projects().filter((p) => p.visibleOnWebsite).length >= MAX_ON_WEBSITE,
  );

  async add(projectId: string): Promise<void> {
    this.processingId.set(projectId);
    try {
      await firstValueFrom(this.projectApi.publish(projectId));
      this.projectStore.reload();
      this.toast.success('Projekt auf der Website veröffentlicht');
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Veröffentlichung fehlgeschlagen'));
    } finally {
      this.processingId.set(null);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
