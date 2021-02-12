import * as functions from 'firebase-functions';
import * as fs from 'fs';

function getCfg(key: string) {
   const nora = functions.config().nora;
   const ret = process.env[key];
   if (typeof nora === 'object') {
     const tmp = nora[key.toLowerCase()];
     if (typeof tmp === 'string') {
       return tmp;
     }
   }
   return ret;
}

export const isLocal = getCfg('NODE_ENV') !== 'production';
const local: any = {
  fireBase: {},
  serviceSockets: [
    {
      port: parseInt(getCfg('PORT'), 10) || 9999,
      address: getCfg('ADDRESS'),
      useHttp2: (getCfg('USE_HTTP2') || 'f').toLowerCase().startsWith('t')
    }
  ]
};
try {
  Object.assign(local, isLocal ? require('./config_local') : {});
} catch (_) {
  console.warn('./config_local not loaded');
}

const secureCookieStr = getCfg('SECURE_COOKIE');
export const secureCookie = !(typeof secureCookieStr === 'string'
    ? secureCookieStr.startsWith('F') || secureCookieStr.startsWith('f') || parseInt(secureCookieStr, 10) === 0
    : isLocal);

export const appTitle = (isLocal ? local.appTitle : getCfg('APPTITLE')) || 'NORA';

function fileOrEnv(key: string, keyFile: string) {
  if (getCfg(key)) {
    return getCfg(key);
  }
  if (typeof getCfg(keyFile) === 'string') {
    return fs.readFileSync(getCfg('keyFile'));
  }
  return;
}

let tls = {
  key: fileOrEnv('TLS_KEY', 'TLS_KEY_FILE'),
  cert: fileOrEnv('TLS_CERT', 'TLS_CERT_FILE')
};
if (!(tls.key && tls.cert)) {
  tls = undefined;
}
export const serviceSockets = isLocal ? local.serviceSockets : [
  {
    port: isLocal ? local.port : parseInt(getCfg('PORT'), 10),
    address: isLocal ? local.address : getCfg('ADDRESS'),
    useHttp2: ((isLocal ? local.useHttp2 : getCfg('USE_HTTP2')) || 'f').toLowerCase().startsWith('t'),
    tls
  }
];
export const oauthClientId = isLocal ? local.oauthClientId : getCfg('OAUTH_ID');
export const oauthClientSecret = isLocal ? local.oauthClientSecret : getCfg('OAUTH_SECRET');
export const jwtCookieName = isLocal ? local.jwtCookieName : getCfg('JWT_COOKIE');
export const googleProjectApiKey = isLocal ? local.googleProjectApiKey : getCfg('PROJECT_API_KEY');
export const serviceAccount = {
    project_id: isLocal ? local.projectId : getCfg('PROJECT_ID'),
    client_email: isLocal ? local.serviceAccountClientEmail
                          : (getCfg('SERVICE_ACCOUNT_CLIENT_EMAIL') || getCfg('SERVICE_ACCOUNT_ISSUER')),
    private_key: isLocal ? local.serviceAccountPrivateKey
                         : (getCfg('SERVICE_ACCOUNT_PRIVATE_KEY') || getCfg('SERVICE_ACCOUNT_KEY'))
};
const serviceAccountJsonFileName = isLocal ? local.serviceAccountJson : getCfg('SERVICE_ACCOUNT_JSON');
if (typeof serviceAccountJsonFileName === 'string') {
    Object.assign(serviceAccount, JSON.parse(fs.readFileSync(serviceAccountJsonFileName).toString()));
}
export const oauthProjectId = isLocal ? local.projectId : getCfg('OAUTH_PROJECT_ID') || serviceAccount.project_id;
export const jwtSecret = isLocal ? local.jwtSecret : getCfg('JWT_SECRET') || serviceAccount.private_key;

export const noraServiceUrl = isLocal ? local.noraServiceUrl : getCfg('NORA_SERVICE_URL') || 'node-red';

let ssl = true;
if (isLocal && typeof local.postgresSsl === 'boolean') {
    ssl = local.postgresSsl;
} else if (typeof getCfg('POSTGRES_SSL') === 'string') {
    const sslString = getCfg('POSTGRES_SSL');
    if (sslString.startsWith('F') || sslString.startsWith('f') || parseInt(sslString, 10) === 0) {
        ssl = false;
    }
}
export const postgres = {
    connectionString: getCfg('DATABASE_URL'),
    ssl: ssl,
    max: (isLocal ? local.postgresMax : ~~getCfg('POSTGRES_MAX')) || 5,
    idleTimeoutMillis: (isLocal ? local.postgresIdleTimeoutMills : ~~getCfg('POSTGRES_IDLETIMEOUTMILLS')) || 4 * this.HOUR,
    connectionTimeoutMillis: (isLocal ? local.postgressConnectionTimeoutMills : ~~getCfg('CONNECTIONTIMEOUTMILLIS')) || 2000
};

export const userAdminUid = isLocal ? local.userAdminUid : getCfg('USER_ADMIN_UID');
export const fireBase = isLocal
    ? local.fireBase
    : {
          apiKey: getCfg('FIREBASE_APIKEY') || 'AIzaSyD8tzIdGqx18PHSBqfOZ258FCch5Xk8y38',
          authDomain: getCfg('FIREBASE_AUTHDOMAIN') || 'node-red-home-automation-82192.firebaseapp.com',
          // tslint:disable-next-line:max-line-length
          databaseURL: getCfg('FIREBASE_DATABASEURL') || 'https://node-red-home-automation-82192.firebaseio.com',
          projectId: getCfg('FIREBASE_PROJECID') || 'node-red-home-automation-82192',
          // tslint:disable-next-line:max-line-length
          storageBucket: getCfg('FIREBASE_STORAGEBUCKET') || 'node-red-home-automation-82192.appspot.com',
          messagingSenderId: getCfg('FIREBASE_MESSAGINGSENDERID') || '350438145283',
          remoteInitUrl: getCfg('FIREBASE_REMOTEINITURL') || '/login/init.js'
      };

fireBase.jsBaseUrl = fireBase.jsBaseUrl || getCfg('FIREBASE_JSBASEURL') || 'https://www.gstatic.com/firebasejs/5.6.0';

const tmpPleaForDonation = isLocal ? local.pleaForDonation : getCfg('PLEA_FOR_DONATION');
export const pleaForDonation = typeof tmpPleaForDonation === 'string' ? tmpPleaForDonation :
  `<h1 class="h6 mt-3 font-weight-normal">
	  Do you like ${appTitle} and find it useful? Consider donating
    <a href="https://paypal.me/andreitatar">Paypal Me</a></h1>`;
