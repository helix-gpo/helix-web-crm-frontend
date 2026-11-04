// loose check matching what the backend accepts - empty is valid, the fields are optional
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
