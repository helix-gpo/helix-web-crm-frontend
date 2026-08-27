export type SortDirection = 'asc' | 'desc' | null;

export interface SortState<TKey extends string> {
  key: TKey | null;
  direction: SortDirection;
}

// 3-Stufen-Zyklus: keine Sortierung -> aufsteigend -> absteigend -> keine (bei erneutem Klick auf dieselbe Spalte)
export function cycleSort<TKey extends string>(
  current: SortState<TKey>,
  key: TKey,
): SortState<TKey> {
  if (current.key !== key) {
    return { key, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { key, direction: 'desc' };
  }
  return { key: null, direction: null };
}

export function sortByKey<T, TKey extends string>(
  items: T[],
  sort: SortState<TKey>,
  accessor: (item: T, key: TKey) => string | number | null | undefined,
): T[] {
  if (!sort.key || !sort.direction) return items;
  const dir = sort.direction === 'asc' ? 1 : -1;

  return [...items].sort((a, b) => {
    const av = accessor(a, sort.key as TKey);
    const bv = accessor(b, sort.key as TKey);

    if (av == null && bv == null) return 0;
    if (av == null) return 1; // leere Werte immer ans Ende, unabhängig von Richtung
    if (bv == null) return -1;

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv), 'de', { sensitivity: 'base' }) * dir;
  });
}
