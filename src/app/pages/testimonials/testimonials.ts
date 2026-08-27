import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Avatar } from '../../util/avatar/avatar';
import { TestimonialStore } from '../../core/testimonials/testimonial-store';
import { Toast } from '../../core/toast/toast';
import { TestimonialStatus } from '../../model/testimonial';
import {
  FilterDialog,
  FilterFieldConfig,
  ActiveFilters,
} from '../../shared/filter-dialog/filter-dialog';

type TabFilter = TestimonialStatus | 'ALL';
type SortOption = 'newest' | 'oldest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';

@Component({
  selector: 'app-testimonials',
  imports: [Avatar, MatDialogModule],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss',
})
export class Testimonials {
  protected readonly testimonialStore = inject(TestimonialStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);

  readonly activeTab = signal<TabFilter>('ALL');
  readonly ratingArray = [1, 2, 3, 4, 5];
  readonly processingId = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly sortOption = signal<SortOption>('newest');
  readonly activeFilters = signal<ActiveFilters>({});

  readonly tabs: { status: TabFilter; label: string }[] = [
    { status: 'ALL', label: 'Alle' },
    { status: 'PENDING_REVIEW', label: 'Zur Prüfung' },
    { status: 'APPROVED', label: 'Freigegeben' },
    { status: 'REJECTED', label: 'Abgelehnt' },
  ];

  readonly statusLabels: Record<TestimonialStatus, string> = {
    PENDING_REVIEW: 'Zur Prüfung',
    APPROVED: 'Freigegeben',
    REJECTED: 'Abgelehnt',
  };

  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Neueste zuerst' },
    { value: 'oldest', label: 'Älteste zuerst' },
    { value: 'rating-desc', label: 'Bewertung: hoch zuerst' },
    { value: 'rating-asc', label: 'Bewertung: niedrig zuerst' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ];

  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'visibleOnWebsite',
      label: 'Website-Sichtbarkeit',
      options: [
        { value: 'true', label: 'Sichtbar' },
        { value: 'false', label: 'Nicht sichtbar' },
      ],
    },
    {
      key: 'rating',
      label: 'Bewertung',
      options: [
        { value: '5', label: '5 Sterne' },
        { value: '4', label: '4 Sterne' },
        { value: '3', label: '3 Sterne' },
        { value: '2', label: '2 Sterne' },
        { value: '1', label: '1 Stern' },
      ],
    },
  ];

  readonly activeFilterCount = computed(() =>
    Object.values(this.activeFilters()).reduce((sum, values) => sum + values.length, 0),
  );

  readonly filteredTestimonials = computed(() => {
    const tab = this.activeTab();
    const term = this.searchTerm().toLowerCase().trim();
    const filters = this.activeFilters();

    let items = this.testimonialStore.testimonials();

    if (tab !== 'ALL') {
      items = items.filter((t) => t.status === tab);
    }

    if (term) {
      items = items.filter(
        (t) =>
          t.partnerName.toLowerCase().includes(term) ||
          t.companyName.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term),
      );
    }

    if (filters['visibleOnWebsite']?.length) {
      items = items.filter((t) => filters['visibleOnWebsite'].includes(String(t.visibleOnWebsite)));
    }
    if (filters['rating']?.length) {
      items = items.filter((t) => filters['rating'].includes(String(t.rating)));
    }

    return [...items].sort((a, b) => {
      switch (this.sortOption()) {
        case 'newest':
          return b.createdAt.localeCompare(a.createdAt);
        case 'oldest':
          return a.createdAt.localeCompare(b.createdAt);
        case 'rating-desc':
          return b.rating - a.rating;
        case 'rating-asc':
          return a.rating - b.rating;
        case 'name-asc':
          return a.partnerName.localeCompare(b.partnerName, 'de');
        case 'name-desc':
          return b.partnerName.localeCompare(a.partnerName, 'de');
      }
    });
  });

  readonly pendingCount = computed(
    () => this.testimonialStore.testimonials().filter((t) => t.status === 'PENDING_REVIEW').length,
  );

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

  async approve(id: string): Promise<void> {
    this.processingId.set(id);
    try {
      await this.testimonialStore.approve(id);
      this.toast.success('Referenz freigegeben');
    } finally {
      this.processingId.set(null);
    }
  }

  async reject(id: string): Promise<void> {
    this.processingId.set(id);
    try {
      await this.testimonialStore.reject(id);
      this.toast.success('Referenz abgelehnt');
    } finally {
      this.processingId.set(null);
    }
  }

  async publish(id: string): Promise<void> {
    this.processingId.set(id);
    try {
      await this.testimonialStore.publish(id);
      this.toast.success('Referenz auf der Website veröffentlicht');
    } finally {
      this.processingId.set(null);
    }
  }

  async unpublish(id: string): Promise<void> {
    this.processingId.set(id);
    try {
      await this.testimonialStore.unpublish(id);
      this.toast.success('Referenz von der Website entfernt');
    } finally {
      this.processingId.set(null);
    }
  }
}
