import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ProjectApi } from '../../../core/projects/project-api';
import { Milestone, MilestoneStatus } from '../../../model/project';
import { CharCounter } from '../../../shared/char-counter/char-counter';
import { dueDateError } from '../../../util/validation/date-range';

export interface MilestoneDialogData {
  projectId: string;
  milestone?: Milestone;
  projectStart?: string;
  projectEnd?: string;
}

@Component({
  selector: 'app-milestone-dialog',
  imports: [CharCounter],
  templateUrl: './milestone-dialog.html',
  styleUrl: './milestone-dialog.scss',
})
export class MilestoneDialog {
  private readonly dialogRef = inject(MatDialogRef<MilestoneDialog>);
  private readonly projectApi = inject(ProjectApi);
  protected readonly data = inject<MilestoneDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = computed(() => !!this.data.milestone);

  readonly dueDateProblem = computed(() =>
    dueDateError(this.dueDate() || undefined, this.data.projectStart, this.data.projectEnd),
  );

  readonly statusOptions: { value: MilestoneStatus; label: string }[] = [
    { value: 'PLANNED', label: 'Geplant' },
    { value: 'IN_PROGRESS', label: 'In Arbeit' },
    { value: 'DONE', label: 'Abgeschlossen' },
  ];

  readonly title = signal(this.data.milestone?.title ?? '');
  readonly description = signal(this.data.milestone?.description ?? '');
  readonly dueDate = signal(this.data.milestone?.dueDate ?? '');
  readonly priceAmount = signal(this.data.milestone?.price?.amount?.toString() ?? '');
  readonly status = signal<MilestoneStatus>(this.data.milestone?.status ?? 'PLANNED');

  readonly submitting = signal(false);
  readonly showWarning = signal(false);

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    if (!this.title().trim()) {
      this.showWarning.set(true);
      return;
    }

    if (this.dueDateProblem()) {
      return;
    }

    this.submitting.set(true);

    const amount = parseFloat(this.priceAmount().replace(',', '.'));
    const price = !isNaN(amount) && amount > 0 ? { amount, currencyCode: 'EUR' } : undefined;

    try {
      let result: Milestone;

      if (this.isEditMode()) {
        result = await firstValueFrom(
          this.projectApi.updateMilestone(this.data.projectId, this.data.milestone!.id, {
            title: this.title().trim(),
            description: this.description().trim() || undefined,
            dueDate: this.dueDate() || undefined,
            price,
            status: this.status(),
          }),
        );
      } else {
        result = await firstValueFrom(
          this.projectApi.addMilestone(this.data.projectId, {
            title: this.title().trim(),
            description: this.description().trim() || undefined,
            dueDate: this.dueDate() || undefined,
            price,
          }),
        );
      }

      this.dialogRef.close(result);
    } finally {
      this.submitting.set(false);
    }
  }
}
