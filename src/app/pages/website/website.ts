import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ProjectStore } from '../../core/projects/project-store';
import { ProjectApi } from '../../core/projects/project-api';
import { TenantStore } from '../../core/tenants/tenant-store';
import { TestimonialStore } from '../../core/testimonials/testimonial-store';
import { Toast } from '../../core/toast/toast';
import { extractErrorMessage } from '../../core/errors/error-message';
import { getContrastTextColor } from '../../util/color-contrast';
import { AddProjectDialog } from './add-project-dialog/add-project-dialog';
import { AddTestimonialDialog } from './add-testimonial-dialog/add-testimonial-dialog';
import { Project } from '../../model/project';
import { Testimonial } from '../../model/testimonial';
import { Avatar } from '../../util/avatar/avatar';

const MAX_ON_WEBSITE = 6;

@Component({
  selector: 'app-website',
  imports: [MatDialogModule, Avatar],
  templateUrl: './website.html',
  styleUrl: './website.scss',
})
export class Website {
  protected readonly projectStore = inject(ProjectStore);
  protected readonly testimonialStore = inject(TestimonialStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly projectApi = inject(ProjectApi);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(Toast);

  protected readonly getContrastTextColor = getContrastTextColor;
  readonly ratingArray = [1, 2, 3, 4, 5];
  readonly maxOnWebsite = MAX_ON_WEBSITE;

  readonly processingProjectId = signal<string | null>(null);
  readonly processingTestimonialId = signal<string | null>(null);

  private readonly tenantNameById = computed(() => {
    const map = new Map<string, string>();
    this.tenantStore.tenants().forEach((t) => map.set(t.id, t.companyName));
    return map;
  });

  tenantName(tenantId: string): string {
    return this.tenantNameById().get(tenantId) ?? 'Unbekannt';
  }

  formatMonthYear(dateString: string): string {
    return new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(
      new Date(dateString),
    );
  }

  readonly publishedProjects = computed(() =>
    [...this.projectStore.projects()]
      .filter((p) => p.visibleOnWebsite)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );

  readonly publishedTestimonials = computed(() =>
    [...this.testimonialStore.testimonials()]
      .filter((t) => t.visibleOnWebsite)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );

  readonly projectSlots = computed(() => {
    const published = this.publishedProjects();
    return Array.from({ length: MAX_ON_WEBSITE }, (_, i) => published[i] ?? null);
  });

  readonly testimonialSlots = computed(() => {
    const published = this.publishedTestimonials();
    return Array.from({ length: MAX_ON_WEBSITE }, (_, i) => published[i] ?? null);
  });

  readonly projectSlotsFull = computed(() => this.publishedProjects().length >= MAX_ON_WEBSITE);
  readonly testimonialSlotsFull = computed(
    () => this.publishedTestimonials().length >= MAX_ON_WEBSITE,
  );

  openAddProjectDialog(): void {
    this.dialog.open(AddProjectDialog, { width: '56rem', panelClass: 'app-dialog-panel' });
  }

  openAddTestimonialDialog(): void {
    this.dialog.open(AddTestimonialDialog, { width: '56rem', panelClass: 'app-dialog-panel' });
  }

  async unpublishProject(project: Project): Promise<void> {
    this.processingProjectId.set(project.id);
    try {
      await firstValueFrom(this.projectApi.unpublish(project.id));
      this.projectStore.reload();
      this.toast.success(`${project.title} von der Website entfernt`);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Entfernen fehlgeschlagen'));
    } finally {
      this.processingProjectId.set(null);
    }
  }

  async unpublishTestimonial(testimonial: Testimonial): Promise<void> {
    this.processingTestimonialId.set(testimonial.id);
    try {
      await this.testimonialStore.unpublish(testimonial.id);
      this.toast.success(`Referenz von ${testimonial.partnerName} von der Website entfernt`);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Entfernen fehlgeschlagen'));
    } finally {
      this.processingTestimonialId.set(null);
    }
  }
}
