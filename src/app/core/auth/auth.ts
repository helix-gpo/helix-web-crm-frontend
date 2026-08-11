import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth-config';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);

  readonly isAuthenticated = signal(false);
  readonly userName = signal<string | null>(null);
  readonly userEmail = signal<string | null>(null);

  constructor() {
    this.oauthService.events.subscribe((event) => {
      if (event.type === 'token_received' || event.type === 'token_refreshed') {
        this.updateUserState();
      }
      if (event.type === 'logout' || event.type === 'session_terminated') {
        this.clearUserState();
      }
      // Silent Refresh ist fehlgeschlagen (Refresh-Token abgelaufen/ungültig) -
      // war der Nutzer vorher eingeloggt, war das keine bewusste Aktion,
      // sondern eine "gesprengte" Session -> eigene Seite dafür anzeigen
      if (event.type === 'token_refresh_error') {
        this.handleSessionExpired();
      }
    });
  }

  async init(): Promise<void> {
    this.oauthService.configure(authConfig);
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.oauthService.setupAutomaticSilentRefresh();
    this.updateUserState();
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut(true);
    window.location.href = this.buildCognitoLogoutUrl();
  }

  getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  private handleSessionExpired(): void {
    const wasAuthenticated = this.isAuthenticated();
    this.clearUserState();

    if (wasAuthenticated) {
      this.router.navigate(['/session-expired']);
    }
  }

  private buildCognitoLogoutUrl(): string {
    const domain = environment.auth.cognitoDomain;
    const clientId = environment.auth.clientId;
    const logoutUri = encodeURIComponent(environment.auth.postLogoutRedirectUri);
    return `${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
  }

  private updateUserState(): void {
    const hasValidToken = this.oauthService.hasValidAccessToken();
    this.isAuthenticated.set(hasValidToken);

    if (hasValidToken) {
      const claims = this.oauthService.getIdentityClaims() as Record<string, string> | null;
      this.userName.set(claims?.['name'] ?? null);
      this.userEmail.set(claims?.['email'] ?? null);
    } else {
      this.clearUserState();
    }
  }

  private clearUserState(): void {
    this.isAuthenticated.set(false);
    this.userName.set(null);
    this.userEmail.set(null);
  }
}
