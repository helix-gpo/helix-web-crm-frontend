import { EntityType, PermissionAction, PermissionKey } from '../../../model/access';
import { ACTION_LABELS, ENTITY_LABELS } from '../../../model/access-labels';

interface PermissionDependency {
  requires: PermissionKey[];
  reason: string;
}

// what the UI needs in addition, besides the implicit rule "write/delete need read"
const DEPENDENCIES: Partial<Record<PermissionKey, PermissionDependency>> = {
  'PROJECT:READ': {
    requires: ['TENANT:READ'],
    reason: 'Projektseiten zeigen den Mandantennamen',
  },
  'MILESTONE:READ': {
    requires: ['PROJECT:READ'],
    reason: 'Meilensteine werden auf der Projektseite angezeigt',
  },
  'PARTNER:READ': {
    requires: ['TENANT:READ'],
    reason: 'Ansprechpartner werden auf der Mandantenseite angezeigt',
  },
  'INVOICE:READ': {
    requires: ['TENANT:READ', 'PROJECT:READ'],
    reason: 'Rechnungen zeigen Mandanten- und Projektnamen',
  },
  'TESTIMONIAL:READ': {
    requires: ['PROJECT:READ'],
    reason: 'Der Website-Bereich zeigt auch Projekte',
  },
  'TESTIMONIAL:WRITE': {
    requires: ['PARTNER:READ', 'PROJECT:READ'],
    reason: 'Referenzen werden pro Ansprechpartner und optional pro Projekt angefragt',
  },
  'TENANT:WRITE': {
    requires: ['PARTNER:WRITE'],
    reason: 'Beim Anlegen eines Mandanten können direkt Ansprechpartner mitangelegt werden',
  },
};

export function describeKey(key: PermissionKey): string {
  const [entity, action] = key.split(':') as [EntityType, PermissionAction];
  return `${ENTITY_LABELS[entity]} ${ACTION_LABELS[action].toLowerCase()}`;
}

function requirementsOf(key: PermissionKey): { required: PermissionKey; reason: string }[] {
  const [entity, action] = key.split(':') as [EntityType, PermissionAction];
  const result: { required: PermissionKey; reason: string }[] = [];

  if (action !== 'READ') {
    result.push({
      required: `${entity}:READ` as PermissionKey,
      reason: 'Bearbeiten und Löschen setzen Lesen voraus',
    });
  }

  const dependency = DEPENDENCIES[key];
  dependency?.requires.forEach((required) => result.push({ required, reason: dependency.reason }));

  return result;
}

// missing permission -> why it is needed, transitive (a missing one can require further ones)
export function findMissingPermissions(
  selected: ReadonlySet<PermissionKey>,
): Map<PermissionKey, string[]> {
  const missing = new Map<PermissionKey, string[]>();
  const queue = [...selected];
  const visited = new Set<PermissionKey>(selected);

  while (queue.length > 0) {
    const key = queue.shift()!;

    for (const { required, reason } of requirementsOf(key)) {
      if (selected.has(required)) {
        continue;
      }

      const text = `${describeKey(key)}: ${reason}`;
      const reasons = missing.get(required) ?? [];
      if (!reasons.includes(text)) {
        reasons.push(text);
      }
      missing.set(required, reasons);

      if (!visited.has(required)) {
        visited.add(required);
        queue.push(required);
      }
    }
  }

  return missing;
}
