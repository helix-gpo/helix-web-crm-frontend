import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { Permissions } from '../access/permissions';

export const adminGuard: CanActivateFn = () => {
  const permissions = inject(Permissions);
  const router = inject(Router);

  return toObservable(permissions.loaded).pipe(
    filter(Boolean),
    take(1),
    // /home picks the right start page - /dashboard would loop for non-admins
    map(() => permissions.isAdmin() || router.createUrlTree(['/home'])),
  );
};
