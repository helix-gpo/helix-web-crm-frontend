import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Avatar } from '../../util/avatar/avatar';
import { TenantStore } from '../../core/tenants/tenant-store';
import { Toast } from '../../core/toast/toast';
import { CreateTenantDialog } from './create-tenant-dialog/create-tenant-dialog';
import { EditCoreDetailsDialog } from './edit-core-details-dialog/edit-core-details-dialog';
import { Tenant } from '../../model/tenant';
import { SortableHeader } from '../../shared/sortable-header/sortable-header';
import {
  FilterDialog,
  FilterFieldConfig,
  ActiveFilters,
} from '../../shared/filter-dialog/filter-dialog';
import { cycleSort, sortByKey, SortState, SortDirection } from '../../util/sortable/sortable';

type TenantSortKey = 'companyName' | 'contactEmail' | 'city' | 'status';

@Component({
  selector: 'app-tenants',
  imports: [Avatar, MatMenuModule, MatDividerModule, MatDialogModule, SortableHeader],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})
export class Tenants {
  protected readonly tenantStore = inject(TenantStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);

  readonly searchTerm = signal('');
  readonly sort = signal<SortState<TenantSortKey>>({ key: null, direction: null });
  readonly activeFilters = signal<ActiveFilters>({});

  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'PROSPECT', label: 'Interessent' },
        { value: 'ACTIVE', label: 'Aktiv' },
        { value: 'INACTIVE', label: 'Inaktiv' },
        { value: 'ARCHIVED', label: 'Archiviert' },
      ],
    },
    {
      key: 'visibleOnWebsite',
      label: 'Website-Sichtbarkeit',
      options: [
        { value: 'true', label: 'Sichtbar' },
        { value: 'false', label: 'Nicht sichtbar' },
      ],
    },
  ];

  readonly activeFilterCount = computed(() =>
    Object.values(this.activeFilters()).reduce((sum, values) => sum + values.length, 0),
  );

  readonly filteredTenants = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    let tenants = this.tenantStore.tenants();

    if (term) {
      tenants = tenants.filter((t) =>
        [t.companyName, t.vatId, t.contactEmail, t.address?.city]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term)),
      );
    }

    const filters = this.activeFilters();

    if (filters['status']?.length) {
      tenants = tenants.filter((t) => filters['status'].includes(t.status));
    }
    if (filters['visibleOnWebsite']?.length) {
      tenants = tenants.filter((t) =>
        filters['visibleOnWebsite'].includes(String(t.visibleOnWebsite)),
      );
    }

    return sortByKey(tenants, this.sort(), (t, key) => {
      switch (key) {
        case 'companyName':
          return t.companyName;
        case 'contactEmail':
          return t.contactEmail ?? '';
        case 'city':
          return t.address?.city ?? '';
        case 'status':
          return t.status;
      }
    });
  });

  readonly statusLabels: Record<Tenant['status'], string> = {
    PROSPECT: 'Interessent',
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    ARCHIVED: 'Archiviert',
  };

  toggleSort(key: TenantSortKey): void {
    this.sort.update((current) => cycleSort(current, key));
  }

  sortDirectionFor(key: TenantSortKey): SortDirection {
    const s = this.sort();
    return s.key === key ? s.direction : null;
  }

  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterDialog, {
      width: '48rem',
      panelClass: 'app-dialog-panel',
      data: { fields: this.filterFields, active: this.activeFilters() },
    });

    dialogRef.afterClosed().subscribe((result?: ActiveFilters) => {
      if (result) this.activeFilters.set(result);
    });
  }

  openDetail(tenantId: string): void {
    this.router.navigate(['/tenants', tenantId]);
  }

  async activate(tenant: Tenant): Promise<void> {
    await this.tenantStore.activate(tenant.id);
    this.toast.success(`${tenant.companyName} aktiviert`);
  }

  async archive(tenant: Tenant): Promise<void> {
    await this.tenantStore.archive(tenant.id);
    this.toast.success(`${tenant.companyName} archiviert`);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateTenantDialog, {
      width: '64rem',
      panelClass: 'app-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.toast.success('Mandant angelegt');
    });
  }

  openEditCoreDetails(tenant: Tenant): void {
    const dialogRef = this.dialog.open(EditCoreDetailsDialog, {
      width: '52rem',
      panelClass: 'app-dialog-panel',
      data: tenant,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.tenantStore.reload();
        this.toast.success('Stammdaten aktualisiert');
      }
    });
  }
}
