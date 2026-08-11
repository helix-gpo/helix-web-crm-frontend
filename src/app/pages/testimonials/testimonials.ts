import { Component, computed, inject, signal } from '@angular/core';
import { Avatar } from '../../util/avatar/avatar';
import { TestimonialStore } from '../../core/testimonials/testimonial-store';
import { TestimonialStatus } from '../../model/testimonial';

@Component({
  selector: 'app-testimonials',
  imports: [Avatar],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss',
})
export class Testimonials {
  protected readonly testimonialStore = inject(TestimonialStore);

  readonly activeTab = signal<TestimonialStatus>('PENDING_REVIEW');
  readonly ratingArray = [1, 2, 3, 4, 5];

  readonly tabs: { status: TestimonialStatus; label: string }[] = [
    { status: 'PENDING_REVIEW', label: 'Zur Prüfung' },
    { status: 'APPROVED', label: 'Freigegeben' },
    { status: 'REJECTED', label: 'Abgelehnt' },
  ];

  readonly filteredTestimonials = computed(() =>
    this.testimonialStore.testimonials().filter((t) => t.status === this.activeTab()),
  );

  readonly pendingCount = computed(
    () => this.testimonialStore.testimonials().filter((t) => t.status === 'PENDING_REVIEW').length,
  );

  async approve(id: string): Promise<void> {
    await this.testimonialStore.approve(id);
  }

  async reject(id: string): Promise<void> {
    await this.testimonialStore.reject(id);
  }
}
