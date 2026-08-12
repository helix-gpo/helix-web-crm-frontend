import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProjectStore } from '../../../core/projects/project-store';
import { TenantStore } from '../../../core/tenants/tenant-store';
import { getContrastTextColor } from '../../../util/color-contrast';
import { CreateProjectRequest, ProjectStatus } from '../../../model/project';

export interface CreateProjectDialogData {
  initialStatus?: ProjectStatus;
}

@Component({
  selector: 'app-create-project-dialog',
  imports: [],
  templateUrl: './create-project-dialog.html',
  styleUrl: './create-project-dialog.scss',
})
export class CreateProjectDialog {
  private readonly dialogRef = inject(MatDialogRef<CreateProjectDialog>);
  private readonly projectStore = inject(ProjectStore);
  protected readonly tenantStore = inject(TenantStore);
  private readonly dialogData = inject<CreateProjectDialogData | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  protected readonly getContrastTextColor = getContrastTextColor;

  readonly statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'LEAD', label: 'Interessent' },
    { value: 'IN_PROGRESS', label: 'In Arbeit' },
    { value: 'ON_HOLD', label: 'Pausiert' },
    { value: 'COMPLETED', label: 'Abgeschlossen' },
    { value: 'CANCELLED', label: 'Abgebrochen' },
  ];

  readonly tenantId = signal('');
  readonly title = signal('');
  readonly description = signal('');
  readonly fullDescription = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly status = signal<ProjectStatus>(this.dialogData?.initialStatus ?? 'LEAD');

  readonly highlights = signal<string[]>([]);
  readonly newHighlight = signal('');

  readonly tagPalette = [
    { label: 'Cyan', value: '#03dbff' },
    { label: 'Pink', value: '#fc03d5' },
    { label: 'Navy', value: '#0d1424' },
  ];
  readonly tags = signal<{ value: string; colorHex: string }[]>([]);
  readonly newTagName = signal('');
  readonly newTagColor = signal('#03dbff');

  readonly submitting = signal(false);
  readonly showWarning = signal(false);

  readonly isValid = computed(() => this.tenantId() !== '' && this.title().trim().length > 0);

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

    const request: CreateProjectRequest = {
      tenantId: this.tenantId(),
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      fullDescription: this.fullDescription().trim() || undefined,
      highlights: this.highlights(),
      tags: this.tags(),
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
      status: this.status(),
    };

    try {
      const project = await this.projectStore.create(request);
      this.dialogRef.close(project);
    } finally {
      this.submitting.set(false);
    }
  }
}
