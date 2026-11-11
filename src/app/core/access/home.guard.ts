import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { PermissionKey } from '../../model/access';
import { Permissions } from './permissions';

// order = order in the sidebar
const START_PAGES: [PermissionKey, string][] = [
  ['TENANT:READ', '/tenants'],
  ['PROJECT:READ', '/projects'],
  ['INVOICE:READ', '/invoices'],
  ['TESTIMONIAL:READ', '/testimonials'],
];

export const homeGuard: CanActivateFn = () => {
  const permissions = inject(Permissions);
  const router = inject(Router);

  return toObservable(permissions.loaded).pipe(
    filter(Boolean),
    take(1),
    map(() => {
      if (permissions.isAdmin()) {
        return router.createUrlTree(['/dashboard']);
      }
      const start = START_PAGES.find(([key]) => permissions.can(key));
      return router.createUrlTree([start ? start[1] : '/no-access']);
    }),
  );
};
