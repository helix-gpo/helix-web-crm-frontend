import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Avatar } from '../../util/avatar/avatar';
import { TenantStore } from '../../core/tenants/tenant-store';
import { Tenant } from '../../model/tenant';
import { CreateTenantDialog } from './create-tenant-dialog/create-tenant-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditCoreDetailsDialog } from './edit-core-details-dialog/edit-core-details-dialog';

@Component({
  selector: 'app-tenants',
  imports: [Avatar, MatMenuModule, MatDividerModule],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})
export class Tenants {
  protected readonly tenantStore = inject(TenantStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly searchTerm = signal('');

  readonly filteredTenants = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const tenants = this.tenantStore.tenants();
    if (!term) return tenants;
    return tenants.filter((t) => t.companyName.toLowerCase().includes(term));
  });

  readonly statusLabels: Record<Tenant['status'], string> = {
    PROSPECT: 'Interessent',
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    ARCHIVED: 'Archiviert',
  };

  openDetail(tenantId: string): void {
    this.router.navigate(['/tenants', tenantId]);
  }

  openCreateDialog(): void {
    this.dialog.open(CreateTenantDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
    });
  }

  openEditCoreDetails(tenant: Tenant): void {
    const dialogRef = this.dialog.open(EditCoreDetailsDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: tenant,
    });

    dialogRef.afterClosed().subscribe(() => this.tenantStore.reload());
  }

  async activate(tenant: Tenant): Promise<void> {
    await this.tenantStore.activate(tenant.id);
  }

  async archive(tenant: Tenant): Promise<void> {
    await this.tenantStore.archive(tenant.id);
  }
}
