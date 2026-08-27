import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FilterFieldOption {
  value: string;
  label: string;
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  options: FilterFieldOption[];
}

export type ActiveFilters = Record<string, string[]>;

export interface FilterDialogData {
  fields: FilterFieldConfig[];
  active: ActiveFilters;
}

@Component({
  selector: 'app-filter-dialog',
  imports: [],
  templateUrl: './filter-dialog.html',
  styleUrl: './filter-dialog.scss',
})
export class FilterDialog {
  private readonly dialogRef = inject(MatDialogRef<FilterDialog>);
  protected readonly data = inject<FilterDialogData>(MAT_DIALOG_DATA);

  readonly selected = signal<ActiveFilters>(
    Object.fromEntries(this.data.fields.map((f) => [f.key, [...(this.data.active[f.key] ?? [])]])),
  );

  isChecked(fieldKey: string, value: string): boolean {
    return this.selected()[fieldKey]?.includes(value) ?? false;
  }

  toggle(fieldKey: string, value: string): void {
    this.selected.update((state) => {
      const current = state[fieldKey] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...state, [fieldKey]: next };
    });
  }

  clearAll(): void {
    this.selected.set(Object.fromEntries(this.data.fields.map((f) => [f.key, []])));
  }

  close(): void {
    this.dialogRef.close();
  }

  apply(): void {
    this.dialogRef.close(this.selected());
  }
}
