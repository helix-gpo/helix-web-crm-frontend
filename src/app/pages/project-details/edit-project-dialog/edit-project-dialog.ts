import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ProjectApi } from '../../../core/projects/project-api';
import { Project, ProjectStatus } from '../../../model/project';
import { getContrastTextColor } from '../../../util/color-contrast';

@Component({
  selector: 'app-edit-project-dialog',
  imports: [],
  templateUrl: './edit-project-dialog.html',
  styleUrl: './edit-project-dialog.scss',
})
export class EditProjectDialog {
  private readonly dialogRef = inject(MatDialogRef<EditProjectDialog>);
  private readonly projectApi = inject(ProjectApi);
  protected readonly data = inject<Project>(MAT_DIALOG_DATA);
  protected readonly getContrastTextColor = getContrastTextColor;

  readonly statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'LEAD', label: 'Interessent' },
    { value: 'IN_PROGRESS', label: 'In Arbeit' },
    { value: 'ON_HOLD', label: 'Pausiert' },
    { value: 'COMPLETED', label: 'Abgeschlossen' },
    { value: 'CANCELLED', label: 'Abgebrochen' },
  ];

  readonly title = signal(this.data.title);
  readonly description = signal(this.data.description ?? '');
  readonly fullDescription = signal(this.data.fullDescription ?? '');
  readonly startDate = signal(this.data.startDate ?? '');
  readonly endDate = signal(this.data.endDate ?? '');
  readonly status = signal<ProjectStatus>(this.data.status);

  readonly highlights = signal<string[]>([...this.data.highlights]);
  readonly newHighlight = signal('');

  readonly tagPalette = [
    { label: 'Cyan', value: '#03dbff' },
    { label: 'Pink', value: '#fc03d5' },
    { label: 'Navy', value: '#0d1424' },
  ];
  readonly tags = signal([...this.data.tags]);
  readonly newTagName = signal('');
  readonly newTagColor = signal('#03dbff');

  readonly submitting = signal(false);
  readonly showWarning = signal(false);

  readonly isValid = computed(() => this.title().trim().length > 0);

  addHighlight(): void {
    const value = this.newHighlight().trim();
    if (!value) return;
    this.highlights.update((list) => [...list, value]);
    this.newHighlight.set('');
  }

  removeHighlight(index: number): void {
    this.highlights.update((list) => list.filter((_, i) => i !== index));
  }

  addTag(): void {
    const value = this.newTagName().trim();
    if (!value) return;
    this.tags.update((list) => [...list, { value, colorHex: this.newTagColor() }]);
    this.newTagName.set('');
  }

  removeTag(index: number): void {
    this.tags.update((list) => list.filter((_, i) => i !== index));
  }

  close(): void {
    this.dialogRef.close();
  }

  async submit(): Promise<void> {
    if (!this.isValid()) {
      this.showWarning.set(true);
      return;
    }

    this.submitting.set(true);

    try {
      let updated = await firstValueFrom(
        this.projectApi.update(this.data.id, {
          title: this.title().trim(),
          description: this.description().trim() || undefined,
          fullDescription: this.fullDescription().trim() || undefined,
          highlights: this.highlights(),
          tags: this.tags(),
          startDate: this.startDate() || undefined,
          endDate: this.endDate() || undefined,
        }),
      );

      // Status separat ändern, da er über einen eigenen Endpunkt läuft -
      // nur aufrufen, wenn er sich tatsächlich geändert hat
      if (this.status() !== this.data.status) {
        updated = await firstValueFrom(this.projectApi.changeStatus(this.data.id, this.status()));
      }

      this.dialogRef.close(updated);
    } finally {
      this.submitting.set(false);
    }
  }
}
