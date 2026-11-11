import { ProjectStatus } from './project';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  LEAD: 'Interessent',
  IN_PROGRESS: 'In Arbeit',
  ON_HOLD: 'Pausiert',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

// mirrors ProjectStatus.canChangeTo in the backend
const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  LEAD: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['IN_PROGRESS'],
  CANCELLED: ['IN_PROGRESS'],
};

export function isClosed(status: ProjectStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

// current status first, so the select shows it as selected
export function allowedStatusOptions(
  current: ProjectStatus,
): { value: ProjectStatus; label: string }[] {
  return [current, ...TRANSITIONS[current]].map((value) => ({
    value,
    label:
      value === 'IN_PROGRESS' && isClosed(current) ? 'Wieder öffnen' : PROJECT_STATUS_LABELS[value],
  }));
}
