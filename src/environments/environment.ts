export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8081/api/crm',
  auth: {
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_mWfiv7VVv',
    clientId: '3k9vr6j2nv6po6djjvp42bg97m',
    redirectUri: `${window.location.origin}/callback`,
    postLogoutRedirectUri: window.location.origin,
    scope: 'openid email profile',
    cognitoDomain: 'https://us-east-1mwfiv7vvv.auth.us-east-1.amazoncognito.com',
  },
};
