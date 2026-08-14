import { HttpErrorResponse } from '@angular/common/http';

// Liest die "detail"-Nachricht aus einem RFC-7807-ProblemDetail-Response
// des Backends (GlobalExceptionHandler) - fällt auf einen generischen
// Text zurück, falls das Backend (noch) kein ProblemDetail liefert
// (z.B. bei Netzwerkfehlern oder unerwarteten Response-Formaten)
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const detail = err.error?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
  }
  return fallback;
}
