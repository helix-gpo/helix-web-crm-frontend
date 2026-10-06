import { EntityType, PermissionAction } from './access';

export const ENTITY_LABELS: Record<EntityType, string> = {
  TENANT: 'Mandanten',
  PROJECT: 'Projekte',
  MILESTONE: 'Meilensteine',
  INVOICE: 'Rechnungen',
  PARTNER: 'Ansprechpartner',
  TESTIMONIAL: 'Referenzen',
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  READ: 'Lesen',
  WRITE: 'Bearbeiten',
  DELETE: 'Löschen',
};
