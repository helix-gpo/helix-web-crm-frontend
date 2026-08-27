import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Toast } from '../toast/toast';
import { extractErrorMessage } from './error-message';
import { environment } from '../../../environments/environment';

// Zeigt bei JEDER fehlgeschlagenen Mutation (POST/PUT/PATCH/DELETE) an unser
// eigenes Backend automatisch einen sprechenden Fehler-Toast - unabhängig
// davon, ob die aufrufende Komponente selbst einen catch-Block hat.
//
// GET-Requests sind bewusst ausgenommen: fehlgeschlagene Ladevorgänge zeigen
// wir inline über die jeweilige httpResource.error()-Anzeige an, ein
// zusätzlicher Toast wäre dort redundant.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(Toast);

  return next(req).pipe(
    catchError((err: unknown) => {
      const isOwnBackend = req.url.startsWith(environment.apiBaseUrl);
      const isMutation = req.method !== 'GET';

      if (isOwnBackend && isMutation && err instanceof HttpErrorResponse) {
        toast.error(extractErrorMessage(err, 'Aktion fehlgeschlagen. Bitte versuche es erneut.'));
      }

      return throwError(() => err);
    }),
  );
};
