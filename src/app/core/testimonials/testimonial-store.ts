import { Injectable, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Testimonial } from '../../model/testimonial';
import { TestimonialApi } from './testimonial-api';

@Injectable({ providedIn: 'root' })
export class TestimonialStore {
  private readonly testimonialApi = inject(TestimonialApi);

  private readonly testimonialsResource = httpResource<Testimonial[]>(
    () => `${environment.apiBaseUrl}/testimonials`,
    { defaultValue: [] },
  );

  readonly testimonials = computed(() => this.testimonialsResource.value() ?? []);
  readonly loading = computed(() => this.testimonialsResource.isLoading());

  reload(): void {
    this.testimonialsResource.reload();
  }

  async approve(id: string): Promise<void> {
    await firstValueFrom(this.testimonialApi.approve(id));
    this.reload();
  }

  async reject(id: string): Promise<void> {
    await firstValueFrom(this.testimonialApi.reject(id));
    this.reload();
  }
}
