export const environment = {
  production: true,
  apiBaseUrl: 'https://api.helix-gpo.com/api/crm',
  websiteBaseUrl: 'https://helix-gpo.com',
  cognito: {
    issuer: 'https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_XXXXXXX',
    clientId: '<neue-prod-client-id>',
    redirectUri: 'https://crm.helix-gpo.com/',
  },
};
