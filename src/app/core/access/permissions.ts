import { Injectable, computed, effect, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Auth } from '../auth/auth';
import { Me, PermissionKey } from '../../model/access';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Permissions {
  private readonly auth = inject(Auth);

  private readonly meResource = httpResource<Me>(() =>
    this.auth.isAuthenticated() ? `${environment.apiBaseUrl}/me` : undefined,
  );
  readonly hasNoAccount = computed(() => {
    const me = this.me();
    return !!me && me.roleName === null;
  });

  readonly isAdmin = computed(() => this.me()?.unrestricted === true);
  readonly me = computed(() => (this.meResource.hasValue() ? this.meResource.value() : undefined));

  // 'reloading' counts as loaded: the previous value stays usable while /me refreshes
  readonly loaded = computed(() =>
    ['resolved', 'local', 'error', 'reloading'].includes(this.meResource.status()),
  );

  constructor() {
    // re-check on every navigation: deactivated users get logged out, role changes apply immediately
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.auth.isAuthenticated()) {
          this.meResource.reload();
        }
      });
  }

  // false until loaded: restricted users never see a flash of forbidden entries
  can(key: PermissionKey): boolean {
    const me = this.me();
    if (!me) {
      return false;
    }
    if (me.unrestricted) {
      return true;
    }
    const [entity, action] = key.split(':');
    return me.permissions.some((p) => p.entity === entity && p.action === action);
  }
}
