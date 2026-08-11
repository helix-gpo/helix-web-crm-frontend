import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

export const authConfig: AuthConfig = {
  issuer: environment.auth.issuer,
  redirectUri: environment.auth.redirectUri,
  postLogoutRedirectUri: environment.auth.postLogoutRedirectUri,
  clientId: environment.auth.clientId,
  responseType: 'code',
  scope: environment.auth.scope,
  showDebugInformation: !environment.production,
  // Cognitos Discovery Document weicht in Details vom Standard ab (fehlende
  // Felder wie end_session_endpoint) - strikte Validierung würde daran scheitern
  strictDiscoveryDocumentValidation: false,
};
