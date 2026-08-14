import { Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TestimonialStore } from '../../../core/testimonials/testimonial-store';
import { Toast } from '../../../core/toast/toast';
import { extractErrorMessage } from '../../../core/errors/error-message';

const MAX_ON_WEBSITE = 6;

@Component({
  selector: 'app-add-testimonial-dialog',
  imports: [],
  templateUrl: './add-testimonial-dialog.html',
  styleUrl: './add-testimonial-dialog.scss',
})
export class AddTestimonialDialog {
  private readonly dialogRef = inject(MatDialogRef<AddTestimonialDialog>);
  protected readonly testimonialStore = inject(TestimonialStore);
  private readonly toast = inject(Toast);

  readonly processingId = signal<string | null>(null);

  // Nur freigegebene, noch nicht veröffentlichte Referenzen sind wählbar -
  // Backend würde alles andere ohnehin ablehnen (siehe TestimonialService.publish)
  readonly eligibleTestimonials = computed(() =>
    this.testimonialStore
      .testimonials()
      .filter((t) => t.status === 'APPROVED' && !t.visibleOnWebsite),
  );

  readonly slotsFull = computed(
    () =>
      this.testimonialStore.testimonials().filter((t) => t.visibleOnWebsite).length >=
      MAX_ON_WEBSITE,
  );

  async add(testimonialId: string): Promise<void> {
    this.processingId.set(testimonialId);
    try {
      await this.testimonialStore.publish(testimonialId);
      this.toast.success('Referenz auf der Website veröffentlicht');
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Veröffentlichung fehlgeschlagen'));
    } finally {
      this.processingId.set(null);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
