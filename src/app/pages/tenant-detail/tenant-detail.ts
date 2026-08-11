import { Component, computed, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Avatar } from '../../util/avatar/avatar';
import { environment } from '../../../environments/environment';
import { TenantStore } from '../../core/tenants/tenant-store';
import { TenantApi } from '../../core/tenants/tenant-api';
import { Toast } from '../../core/toast/toast';
import { ConfirmDialog } from '../../util/confirm-dialog/confirm-dialog';
import { EditTenantDialog } from '../tenants/edit-tenant-dialog/edit-tenant-dialog';
import { EditCoreDetailsDialog } from '../tenants/edit-core-details-dialog/edit-core-details-dialog';
import { PartnerDialog } from '../tenants/partner-dialog/partner-dialog';
import { Tenant, Partner } from '../../model/tenant';
import { Project } from '../../model/project';

@Component({
  selector: 'app-tenant-detail',
  imports: [Avatar, MatDialogModule],
  templateUrl: './tenant-detail.html',
  styleUrl: './tenant-detail.scss',
})
export class TenantDetail {
  readonly id = input.required<string>();

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly tenantStore = inject(TenantStore);
  private readonly tenantApi = inject(TenantApi);
  private readonly toast = inject(Toast);

  private readonly tenantResource = httpResource<Tenant>(
    () => `${environment.apiBaseUrl}/tenants/${this.id()}`,
  );

  private readonly partnersResource = httpResource<Partner[]>(
    () => `${environment.apiBaseUrl}/tenants/${this.id()}/partners`,
    { defaultValue: [] },
  );

  private readonly projectsResource = httpResource<Project[]>(
    () => `${environment.apiBaseUrl}/projects?tenantId=${this.id()}`,
    { defaultValue: [] },
  );

  readonly tenant = computed(() => this.tenantResource.value());
  readonly loading = computed(() => this.tenantResource.isLoading());
  readonly partners = computed(() => this.partnersResource.value() ?? []);
  readonly projects = computed(() => this.projectsResource.value() ?? []);

  readonly statusLabels: Record<Tenant['status'], string> = {
    PROSPECT: 'Interessent',
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    ARCHIVED: 'Archiviert',
  };

  readonly projectStatusLabels: Record<Project['status'], string> = {
    LEAD: 'Interessent',
    IN_PROGRESS: 'In Arbeit',
    ON_HOLD: 'Pausiert',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Abgebrochen',
  };

  // Aktualisiert sowohl diese Detail-Seite als auch die Tenants-Übersicht
  // (gleiches Zwei-Ressourcen-Problem wie bei Projects)
  private refreshEverywhere(): void {
    this.tenantResource.reload();
    this.tenantStore.reload();
  }

  back(): void {
    this.router.navigate(['/tenants']);
  }

  openEditDialog(): void {
    const currentTenant = this.tenant();
    if (!currentTenant) return;

    const dialogRef = this.dialog.open(EditTenantDialog, {
      width: '56rem',
      panelClass: 'app-dialog-panel',
      data: currentTenant,
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.refreshEverywhere();
        this.toast.success('Kontaktdaten aktualisiert');
      }
    });
  }

  openEditCoreDetails(): void {
    const currentTenant = this.tenant();
    if (!currentTenant) return;

    const dialogRef = this.dialog.open(EditCoreDetailsDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: currentTenant,
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.refreshEverywhere();
        this.toast.success('Stammdaten aktualisiert');
      }
    });
  }

  openAddPartnerDialog(): void {
    const dialogRef = this.dialog.open(PartnerDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: { tenantId: this.id() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.partnersResource.reload();
        this.toast.success('Ansprechpartner hinzugefügt');
      }
    });
  }

  openEditPartnerDialog(partner: Partner): void {
    const dialogRef = this.dialog.open(PartnerDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: { tenantId: this.id(), partner },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.partnersResource.reload();
        this.toast.success('Ansprechpartner aktualisiert');
      }
    });
  }

  async deletePartner(partner: Partner): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '44rem',
      panelClass: 'app-dialog-panel',
      data: {
        title: 'Ansprechpartner entfernen?',
        message: `${partner.firstName} ${partner.lastName} wird unwiderruflich aus diesem Mandanten entfernt.`,
        confirmLabel: 'Entfernen',
        danger: true,
      },
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await firstValueFrom(this.tenantApi.removePartner(this.id(), partner.id));
        this.partnersResource.reload();
        this.toast.success('Ansprechpartner entfernt');
      } catch {
        this.toast.error('Ansprechpartner konnte nicht entfernt werden');
      }
    }
  }
}
