import { Component, computed, inject, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectApi } from '../../core/projects/project-api';
import { ProjectStore } from '../../core/projects/project-store';
import { TenantStore } from '../../core/tenants/tenant-store';
import { ConfirmDialog } from '../../util/confirm-dialog/confirm-dialog';
import { MilestoneDialog } from './milestone-dialog/milestone-dialog';
import { EditProjectDialog } from './edit-project-dialog/edit-project-dialog';
import { Toast } from '../../core/toast/toast';
import { Project, ProjectStatus, Milestone } from '../../model/project';

@Component({
  selector: 'app-project-detail',
  imports: [MatDialogModule],
  templateUrl: './project-details.html',
  styleUrl: './project-details.scss',
})
export class ProjectDetail {
  readonly id = input.required<string>();

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly projectApi = inject(ProjectApi);
  private readonly projectStore = inject(ProjectStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly toast = inject(Toast);

  private readonly projectResource = httpResource<Project>(
    () => `${environment.apiBaseUrl}/projects/${this.id()}`,
  );

  readonly project = computed(() => this.projectResource.value());
  readonly loading = computed(() => this.projectResource.isLoading());

  readonly statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'LEAD', label: 'Interessent' },
    { value: 'IN_PROGRESS', label: 'In Arbeit' },
    { value: 'ON_HOLD', label: 'Pausiert' },
    { value: 'COMPLETED', label: 'Abgeschlossen' },
    { value: 'CANCELLED', label: 'Abgebrochen' },
  ];

  readonly tenantName = computed(() => {
    const p = this.project();
    if (!p) return '';
    return this.tenantStore.tenants().find((t) => t.id === p.tenantId)?.companyName ?? 'Unbekannt';
  });

  readonly togglingPublish = signal(false);
  readonly changingStatus = signal(false);

  // Zieht die Änderung sowohl in die eigene (Detail-)Ressource als auch
  // in den geteilten ProjectStore, den Kanban/Liste nutzen - sonst
  // sieht man Änderungen erst nach hartem Reload wieder in der Übersicht
  private refreshEverywhere(): void {
    this.projectResource.reload();
    this.projectStore.reload();
  }

  back(): void {
    this.router.navigate(['/projects']);
  }

  async changeStatus(status: string): Promise<void> {
    this.changingStatus.set(true);
    try {
      await firstValueFrom(this.projectApi.changeStatus(this.id(), status));
      this.refreshEverywhere();
      this.toast.success('Status aktualisiert');
    } catch {
      this.toast.error('Status konnte nicht aktualisiert werden');
    } finally {
      this.changingStatus.set(false);
    }
  }

  async togglePublish(): Promise<void> {
    const p = this.project();
    if (!p) return;

    this.togglingPublish.set(true);
    try {
      const call = p.visibleOnWebsite
        ? this.projectApi.unpublish(this.id())
        : this.projectApi.publish(this.id());
      await firstValueFrom(call);
      this.refreshEverywhere();
      this.toast.success(
        p.visibleOnWebsite ? 'Projekt von Website entfernt' : 'Projekt auf Website veröffentlicht',
      );
    } catch {
      this.toast.error('Aktion fehlgeschlagen');
    } finally {
      this.togglingPublish.set(false);
    }
  }

  openEditDialog(): void {
    const p = this.project();
    if (!p) return;

    const dialogRef = this.dialog.open(EditProjectDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
      data: p,
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.refreshEverywhere();
        this.toast.success('Projekt aktualisiert');
      }
    });
  }

  openAddMilestoneDialog(): void {
    const dialogRef = this.dialog.open(MilestoneDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: { projectId: this.id() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshEverywhere();
        this.toast.success('Meilenstein hinzugefügt');
      }
    });
  }

  openEditMilestoneDialog(milestone: Milestone): void {
    const dialogRef = this.dialog.open(MilestoneDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: { projectId: this.id(), milestone },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshEverywhere();
        this.toast.success('Meilenstein aktualisiert');
      }
    });
  }

  async toggleMilestoneStatus(milestone: Milestone): Promise<void> {
    const newStatus = milestone.status === 'DONE' ? 'PLANNED' : 'DONE';
    await firstValueFrom(this.projectApi.changeMilestoneStatus(this.id(), milestone.id, newStatus));
    this.refreshEverywhere();
    this.toast.success(
      newStatus === 'DONE' ? 'Meilenstein abgeschlossen' : 'Meilenstein wieder geöffnet',
    );
  }

  async deleteMilestone(milestone: Milestone): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '44rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Meilenstein entfernen?',
        message: `"${milestone.title}" wird unwiderruflich entfernt.`,
        confirmLabel: 'Entfernen',
        danger: true,
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      await firstValueFrom(this.projectApi.removeMilestone(this.id(), milestone.id));
      this.refreshEverywhere();
      this.toast.success('Meilenstein entfernt');
    }
  }

  formatMoney(money?: { amount: number; currencyCode: string }): string {
    if (!money) return '–';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: money.currencyCode,
    }).format(money.amount);
  }
}
