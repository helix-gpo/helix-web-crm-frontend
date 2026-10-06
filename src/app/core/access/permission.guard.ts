import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { PermissionKey } from '../../model/access';
import { Permissions } from './permissions';

export const permissionGuard =
  (key: PermissionKey): CanActivateFn =>
  () => {
    const permissions = inject(Permissions);
    const router = inject(Router);

    return toObservable(permissions.loaded).pipe(
      filter(Boolean),
      take(1),
      map(() => permissions.can(key) || router.createUrlTree(['/dashboard'])),
    );
  };
