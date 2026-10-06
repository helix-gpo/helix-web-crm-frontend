import { Component, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { Avatar } from './util/avatar/avatar';
import { Auth } from './core/auth/auth';
import { Permissions } from './core/access/permissions';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avatar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);
  protected readonly permissions = inject(Permissions);

  private readonly publicPaths = ['/', '/login', '/session-expired', '/no-access'];

  protected readonly isPublicPage = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => this.publicPaths.includes(e.urlAfterRedirects)),
      startWith(this.publicPaths.includes(this.router.url)),
    ),
    { initialValue: false },
  );

  constructor() {
    effect(() => {
      if (this.permissions.hasNoAccount() && this.router.url !== '/no-access') {
        this.router.navigate(['/no-access']);
      }
    });
  }
}
