export const environment = {
  production: true,
  apiBaseUrl: "https://api.helix-gpo.com/api/crm",
  websiteBaseUrl: "https://www.helix-gpo.com",
  auth: {
    issuer:
      "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_UPTwKD0cx",
    clientId: "sso4fl9sjnksldrr2lc9r36fp",
    redirectUri: `${window.location.origin}/callback`,
    postLogoutRedirectUri: window.location.origin,
    scope: "openid email profile",
    cognitoDomain: "https://helix-gpo-crm.auth.eu-central-1.amazoncognito.com",
  },
};
