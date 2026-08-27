import { Component, computed, inject, signal } from '@angular/core';
import { Avatar } from '../../util/avatar/avatar';
import { TestimonialStore } from '../../core/testimonials/testimonial-store';
import { Toast } from '../../core/toast/toast';
import { TestimonialStatus } from '../../model/testimonial';

type TabFilter = TestimonialStatus | 'ALL';

@Component({
  selector: 'app-testimonials',
  imports: [Avatar],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss',
})
export class Testimonials {
  protected readonly testimonialStore = inject(TestimonialStore);
  private readonly toast = inject(Toast);

  readonly activeTab = signal<TabFilter>('ALL');
  readonly ratingArray = [1, 2, 3, 4, 5];
  readonly processingId = signal<string | null>(null);

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

  readonly filteredTestimonials = computed(() => {
    const tab = this.activeTab();
    const all = this.testimonialStore.testimonials();
    return tab === 'ALL' ? all : all.filter((t) => t.status === tab);
  });

  readonly pendingCount = computed(
    () => this.testimonialStore.testimonials().filter((t) => t.status === 'PENDING_REVIEW').length,
  );

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
