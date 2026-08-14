import { Component, inject, signal } from '@angular/core';
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
  projects: Project[]; // Projekte dieses Mandanten, zur optionalen Auswahl
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

  // Sobald gesetzt, zeigt der Dialog den fertigen Link statt des Formulars -
  // der Token kommt nur EINMAL vom Backend zurück (nur der Hash landet in
  // der DB), muss also sofort sichtbar gemacht werden
  readonly generatedLink = signal<string | null>(null);
  readonly copied = signal(false);

  close(): void {
    // true = es wurde tatsächlich eine Einladung erzeugt (für Toast im
    // Aufrufer), egal ob der Link schon kopiert wurde oder nicht
    this.dialogRef.close(!!this.generatedLink());
  }

  async submit(): Promise<void> {
    this.submitting.set(true);
    try {
      const response = await firstValueFrom(
        this.testimonialApi.createInvitation({
          partnerId: this.data.partner.id,
          projectId: this.projectId() || undefined,
          expiresInDays: parseInt(this.expiresInDays(), 10) || undefined,
        }),
      );
      this.generatedLink.set(`${environment.websiteBaseUrl}/feedback?token=${response.rawToken}`);
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
