/**
 * Berechnet anhand der relativen Helligkeit einer Hex-Farbe, ob heller
 * oder dunkler Text besser lesbar ist - funktioniert für jede Farbe,
 * nicht nur unsere drei Marken-Töne.
 */
export function getContrastTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0d1424' : '#ffffff';
}
