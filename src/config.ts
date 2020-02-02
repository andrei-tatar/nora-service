import * as fs from 'fs';

export const isLocal = process.env.NODE_ENV !== 'production';
const local = isLocal ? require('./config_local') : {};

const secureCookieStr = process.env.SECURE_COOKIE;
export const secureCookie = !(typeof secureCookieStr === 'string'
    ? secureCookieStr.startsWith('F') || secureCookieStr.startsWith('f') || parseInt(secureCookieStr, 10) === 0
    : isLocal);

export const appTitle = (isLocal ? local.appTitle : process.env.APPTITLE) || 'NORA';

function fileOrEnv(key: string, keyFile: string) {
	if (process.env[key]) {
		return process.env[key];
	}
	if (typeof process.env[keyFile] === 'string') {
		return fs.readFileSync(process.env[keyFile]);
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
		port: isLocal ? local.port : process.env.PORT,
		address: isLocal ? local.address : process.env.ADDRESS,
		tls
	}
];
export const oauthClientId = isLocal ? local.oauthClientId : process.env.OAUTH_ID;
export const oauthClientSecret = isLocal ? local.oauthClientSecret : process.env.OAUTH_SECRET;
export const jwtCookieName = isLocal ? local.jwtCookieName : process.env.JWT_COOKIE;
export const googleProjectApiKey = isLocal ? local.googleProjectApiKey : process.env.PROJECT_API_KEY;
export const serviceAccount = {
    project_id: isLocal ? local.projectId : process.env.PROJECT_ID,
    client_email: isLocal ? local.serviceAccountClientEmail : process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
    private_key: isLocal ? local.serviceAccountPrivateKey : process.env.SERVICE_ACCOUNT_PRIVATE_KEY
};
const serviceAccountJsonFileName = isLocal ? local.serviceAccountJson : process.env.SERVICE_ACCOUNT_JSON;
if (typeof serviceAccountJsonFileName === 'string') {
    Object.assign(serviceAccount, JSON.parse(fs.readFileSync(serviceAccountJsonFileName).toString()));
}
export const oauthProjectId = isLocal ? local.projectId : process.env.OAUTH_PROJECT_ID || serviceAccount.project_id;
export const jwtSecret = isLocal ? local.jwtSecret : process.env.JWT_SECRET || serviceAccount.private_key;

export const noraServiceUrl = isLocal ? local.noraServiceUrl : process.env.NORA_SERVICE_URL || 'node-red';

let ssl = true;
if (isLocal && typeof local.postgresSsl === 'boolean') {
    ssl = local.postgresSsl;
} else if (typeof process.env.POSTGRES_SSL === 'string') {
    const sslString = process.env.POSTGRES_SSL;
    if (sslString.startsWith('F') || sslString.startsWith('f') || parseInt(sslString, 10) === 0) {
        ssl = false;
    }
}
export const postgres = {
    connectionString: isLocal ? local.postgresConnectionString : process.env.POSTGRES_CONNECTIONSTRING,
    ssl: ssl,
    max: (isLocal ? local.postgresMax : ~~process.env.POSTGRES_MAX) || 5,
    idleTimeoutMillis: (isLocal ? local.postgresIdleTimeoutMills : ~~process.env.POSTGRES_IDLETIMEOUTMILLS) || 4 * this.HOUR,
    connectionTimeoutMillis: (isLocal ? local.postgressConnectionTimeoutMills : ~~process.env.CONNECTIONTIMEOUTMILLIS) || 2000
};

export const userAdminUid = isLocal ? local.userAdminUid : process.env.USER_ADMIN_UID;
export const fireBase = isLocal
    ? local.fireBase
    : {
          apiKey: process.env.FIREBASE_APIKEY || 'AIzaSyD8tzIdGqx18PHSBqfOZ258FCch5Xk8y38',
          authDomain: process.env.FIREBASE_AUTHDOMAIN || 'node-red-home-automation-82192.firebaseapp.com',
          // tslint:disable-next-line:max-line-length
          databaseURL: process.env.FIREBASE_DATABASEURL || 'https://node-red-home-automation-82192.firebaseio.com',
          projectId: process.env.FIREBASE_PROJECID || 'node-red-home-automation-82192',
          // tslint:disable-next-line:max-line-length
          storageBucket: process.env.FIREBASE_STORAGEBUCKET || 'node-red-home-automation-82192.appspot.com',
          messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID || '350438145283',
          remoteInitUrl: process.env.FIREBASE_REMOTEINITURL || '/login/init.js'
      };

fireBase.jsBaseUrl = fireBase.jsBaseUrl || process.env.FIREBASE_JSBASEURL || 'https://www.gstatic.com/firebasejs/5.6.0';

const tmpPleaForDonation = isLocal ? local.pleaForDonation : process.env.PLEA_FOR_DONATION;
export const pleaForDonation = typeof tmpPleaForDonation === 'string' ? tmpPleaForDonation :
	`<h1 class="h6 mt-3 font-weight-normal">
	  Do you like ${appTitle} and find it useful? Consider donating
          <a href="https://paypal.me/andreitatar">Paypal Me</a></h1>`;
