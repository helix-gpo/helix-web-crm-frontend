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
  // chips: small fixed sets (status), dropdown: open-ended sets that grow (people)
  variant?: 'chips' | 'dropdown';
}

export type ActiveFilters = Record<string, string[]>;

export interface FilterDialogData {
  fields: FilterFieldConfig[];
  active: ActiveFilters;
}

const SEARCH_THRESHOLD = 6;

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

  readonly openField = signal<string | null>(null);
  readonly searchTerms = signal<Record<string, string>>({});

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

  toggleDropdown(fieldKey: string): void {
    this.openField.update((current) => (current === fieldKey ? null : fieldKey));
  }

  hasSearch(field: FilterFieldConfig): boolean {
    return field.options.length > SEARCH_THRESHOLD;
  }

  searchTerm(fieldKey: string): string {
    return this.searchTerms()[fieldKey] ?? '';
  }

  setSearch(fieldKey: string, value: string): void {
    this.searchTerms.update((state) => ({ ...state, [fieldKey]: value }));
  }

  visibleOptions(field: FilterFieldConfig): FilterFieldOption[] {
    const term = this.searchTerm(field.key).trim().toLowerCase();
    if (!term) {
      return field.options;
    }
    return field.options.filter((option) => option.label.toLowerCase().includes(term));
  }

  selectedOptions(field: FilterFieldConfig): FilterFieldOption[] {
    const values = this.selected()[field.key] ?? [];
    return field.options.filter((option) => values.includes(option.value));
  }

  summary(field: FilterFieldConfig): string {
    const chosen = this.selectedOptions(field);
    if (chosen.length === 0) {
      return 'Alle';
    }
    return chosen.length === 1 ? chosen[0].label : `${chosen.length} ausgewählt`;
  }

  clearAll(): void {
    this.selected.set(Object.fromEntries(this.data.fields.map((f) => [f.key, []])));
    this.searchTerms.set({});
  }

  close(): void {
    this.dialogRef.close();
  }

  apply(): void {
    this.dialogRef.close(this.selected());
  }
}
