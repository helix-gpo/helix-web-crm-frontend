import { Injectable, computed, effect, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Auth } from '../auth/auth';
import { Me, PermissionKey } from '../../model/access';

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
  readonly me = this.meResource.value;

  readonly loaded = computed(() =>
    ['resolved', 'local', 'error'].includes(this.meResource.status()),
  );

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
