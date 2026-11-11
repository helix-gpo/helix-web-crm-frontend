// ISO dates (yyyy-mm-dd) compare correctly as strings
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function periodError(start?: string, end?: string): string | null {
  return start && end && end < start ? 'Das Enddatum darf nicht vor dem Startdatum liegen.' : null;
}

export function dueDateError(due?: string, start?: string, end?: string): string | null {
  if (!due) return null;
  if (start && due < start)
    return `Der Meilenstein muss am oder nach dem Projektstart (${formatDate(start)}) liegen.`;
  if (end && due > end)
    return `Der Meilenstein muss am oder vor dem Projektende (${formatDate(end)}) liegen.`;
  return null;
}
