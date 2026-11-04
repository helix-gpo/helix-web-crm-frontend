// values marked TODO come from terraform outputs once the prod cognito pool exists (block 5)
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.helix-gpo.com/api/crm',
  websiteBaseUrl: 'https://www.helix-gpo.com',
  auth: {
    issuer: 'https://cognito-idp.eu-central-1.amazonaws.com/TODO_POOL_ID',
    clientId: 'TODO_CLIENT_ID',
    redirectUri: `${window.location.origin}/callback`,
    postLogoutRedirectUri: window.location.origin,
    scope: 'openid email profile',
    cognitoDomain: 'https://TODO_DOMAIN.auth.eu-central-1.amazoncognito.com',
  },
};
