import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TestimonialApi } from '../../../core/testimonials/testimonial-api';
import { Toast } from '../../../core/toast/toast';
import { extractErrorMessage } from '../../../core/errors/error-message';
import { Partner } from '../../../model/tenant';
import { Project } from '../../../model/project';

export interface RequestTestimonialDialogData {
  partner: Partner;
  projects: Project[];
}

@Component({
  selector: 'app-request-testimonial-dialog',
  imports: [],
  templateUrl: './request-testimonial-dialog.html',
  styleUrl: './request-testimonial-dialog.scss',
})
export class RequestTestimonialDialog {
  private readonly dialogRef = inject(MatDialogRef<RequestTestimonialDialog>);
  private readonly testimonialApi = inject(TestimonialApi);
  private readonly toast = inject(Toast);
  protected readonly data = inject<RequestTestimonialDialogData>(MAT_DIALOG_DATA);

  readonly projectId = signal('');
  readonly expiresInDays = signal('30');
  readonly submitting = signal(false);

  readonly sendEmail = signal(!!this.data.partner.email);
  readonly email = signal(this.data.partner.email ?? '');
  readonly canSubmit = computed(() => !this.sendEmail() || this.email().trim().length > 3);

  readonly generatedLink = signal<string | null>(null);
  readonly wasSent = signal(false);
  readonly copied = signal(false);

  toggleSendEmail(): void {
    this.sendEmail.update((v) => !v);
  }

  close(): void {
    this.dialogRef.close(!!this.generatedLink());
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    try {
      const response = await firstValueFrom(
        this.testimonialApi.createInvitation({
          partnerId: this.data.partner.id,
          projectId: this.projectId() || undefined,
          expiresInDays: parseInt(this.expiresInDays(), 10) || undefined,
          sendEmail: this.sendEmail(),
          email: this.sendEmail() ? this.email().trim() : undefined,
        }),
      );
      this.generatedLink.set(`${environment.websiteBaseUrl}/feedback?token=${response.rawToken}`);
      this.wasSent.set(response.sent);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Einladung konnte nicht erzeugt werden'));
    } finally {
      this.submitting.set(false);
    }
  }

  async copyLink(): Promise<void> {
    const link = this.generatedLink();
    if (!link) return;
    await navigator.clipboard.writeText(link);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
