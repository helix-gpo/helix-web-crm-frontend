import { auditUserLabel } from '../audit-user';
import { FilterFieldConfig } from './filter-dialog';

export const CREATOR_FILTER_KEY = 'createdBy';

// stands for records without a creator (legacy data)
const NO_CREATOR = '__none__';

export function withCreatorFilter(
  baseFields: FilterFieldConfig[],
  items: readonly { createdBy?: string | null }[],
): FilterFieldConfig[] {
  const creators = new Set<string>();
  let hasUnknown = false;

  for (const item of items) {
    if (item.createdBy) {
      creators.add(item.createdBy);
    } else {
      hasUnknown = true;
    }
  }

  const options = [...creators]
    .map((value) => ({ value, label: auditUserLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));

  if (hasUnknown) {
    options.push({ value: NO_CREATOR, label: 'Unbekannt' });
  }

  if (options.length === 0) {
    return baseFields;
  }

  return [
    ...baseFields,
    { key: CREATOR_FILTER_KEY, label: 'Angelegt von', variant: 'dropdown', options },
  ];
}

export function matchesCreator(
  selected: string[] | undefined,
  createdBy: string | null | undefined,
): boolean {
  if (!selected?.length) {
    return true;
  }
  return selected.includes(createdBy ?? NO_CREATOR);
}
