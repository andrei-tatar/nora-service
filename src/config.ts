export const isLocal = process.env.NODE_ENV !== 'production';
const local = isLocal ? require('./config_local') : {};

export const port = isLocal ? local.port : process.env.PORT;
export const oauthClientId = isLocal ? local.oauthClientId : process.env.OAUTH_ID;
export const oauthClientSecret = isLocal ? local.oauthClientSecret : process.env.OAUTH_SECRET;
export const jwtCookieName = isLocal ? local.jwtCookieName : process.env.JWT_COOKIE;
export const jwtSecret = isLocal ? local.jwtSecret : process.env.JWT_SECRET;
export const projectId = isLocal ? local.projectId : process.env.PROJECT_ID;
export const googleProjectApiKey = isLocal ? local.googleProjectApiKey : process.env.PROJECT_API_KEY;
export const postgressConnectionString = isLocal ? local.postgressConnectionString : process.env.DATABASE_URL;
export const serviceAccountIssuer = isLocal ? local.serviceAccountIssuer : process.env.SERVICE_ACCOUNT_ISSUER;
export const serviceAccountPrivateKey = isLocal ? local.serviceAccountPrivateKey : process.env.SERVICE_ACCOUNT_KEY;
export const userAdminUid = isLocal ? local.userAdminUid : process.env.USER_ADMIN_UID;
