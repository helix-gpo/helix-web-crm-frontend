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
import { CreateInvoiceDialog } from '../invoices/create-invoice-dialog/create-invoice-dialog';
import { Toast } from '../../core/toast/toast';
import { Project, ProjectStatus, Milestone } from '../../model/project';
import { getContrastTextColor } from '../../util/color-contrast';
import { AuditInfo } from '../../shared/audit-info/audit-info';
import { RequiresPermission } from '../../core/access/requires-permission';
import { allowedStatusOptions, isClosed } from '../../model/project-status';
import { InvoiceApi } from '../../core/invoices/invoice-api';

@Component({
  selector: 'app-project-detail',
  imports: [MatDialogModule, AuditInfo, RequiresPermission],
  templateUrl: './project-details.html',
  styleUrl: './project-details.scss',
})
export class ProjectDetail {
  readonly id = input.required<string>();

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly invoiceApi = inject(InvoiceApi);
  private readonly projectApi = inject(ProjectApi);
  private readonly projectStore = inject(ProjectStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly toast = inject(Toast);
  protected readonly getContrastTextColor = getContrastTextColor;

  private readonly projectResource = httpResource<Project>(
    () => `${environment.apiBaseUrl}/projects/${this.id()}`,
  );

  readonly project = computed(() => this.projectResource.value());
  readonly loading = computed(() => this.projectResource.isLoading());

  readonly statusOptions = computed(() => {
    const p = this.project();
    return p ? allowedStatusOptions(p.status) : [];
  });

  readonly closed = computed(() => {
    const p = this.project();
    return !!p && isClosed(p.status);
  });

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

  async changeStatus(select: HTMLSelectElement): Promise<void> {
    const p = this.project();
    if (!p) return;
    const target = select.value as ProjectStatus;
    // select keeps the picked value in the DOM - reset it if the change does not happen
    const reset = () => (select.value = p.status);

    if (target === 'COMPLETED' && !(await this.confirmUninvoicedMilestones(p))) {
      reset();
      return;
    }

    this.changingStatus.set(true);
    try {
      await firstValueFrom(this.projectApi.changeStatus(this.id(), target));
      this.refreshEverywhere();
      this.toast.success('Status aktualisiert');
    } catch {
      reset(); // error toast comes from the interceptor
    } finally {
      this.changingStatus.set(false);
    }
  }

  // not blocking: the final invoice often comes after completion
  private async confirmUninvoicedMilestones(p: Project): Promise<boolean> {
    const prefill = await firstValueFrom(this.invoiceApi.prefill(p.tenantId, p.id));
    const open = prefill.availableMilestones.filter((m) => !m.alreadyInvoiced);
    if (open.length === 0) return true;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '44rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Projekt trotzdem abschließen?',
        message: `Noch nicht abgerechnet: ${open.map((m) => m.title).join(', ')}. Du kannst sie auch nach dem Abschluss noch abrechnen.`,
        confirmLabel: 'Abschließen',
      },
    });
    return !!(await firstValueFrom(dialogRef.afterClosed()));
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

  openCreateInvoiceDialog(): void {
    const p = this.project();
    if (!p) return;

    const dialogRef = this.dialog.open(CreateInvoiceDialog, {
      width: '68rem',
      panelClass: 'app-dialog-panel',
      data: { tenantId: p.tenantId, projectId: p.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.toast.success('Rechnung angelegt');
        this.router.navigate(['/invoices', result.id]);
      }
    });
  }

  openAddMilestoneDialog(): void {
    const dialogRef = this.dialog.open(MilestoneDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: {
        projectId: this.id(),
        projectStart: this.project()?.startDate,
        projectEnd: this.project()?.endDate,
      },
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
      data: {
        projectId: this.id(),
        milestone,
        projectStart: this.project()?.startDate,
        projectEnd: this.project()?.endDate,
      },
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
