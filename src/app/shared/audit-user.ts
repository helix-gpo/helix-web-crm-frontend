const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function auditUserLabel(user: string | null | undefined): string {
  if (!user) {
    return '–';
  }
  if (user === 'system') {
    return 'System';
  }
  if (UUID_PATTERN.test(user)) {
    return 'Nicht zugeordneter Nutzer';
  }
  return user;
}
