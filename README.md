
# nora-service
NORA (https://node-red-google-home.herokuapp.com) backend service deployed in Heroku.

Deployment instructions: (small guide on how to run nora-service on your own Heroku)

Needed:
 - [Heroku app](https://www.heroku.com/)
 - [Firebase App](https://console.firebase.google.com/)
 - [Google Api Console oauth](https://console.developers.google.com/)
 - [Google Actions](https://console.actions.google.com/)

## HEROKU

- Create a new Account and then a new app. From Overview, add new add-on "Heroku Postgres"
To deploy, you can either use the heroku cli or connect your github account. (do not deploy anything yet)
 - Keep this browser tab open

## FIREBASE

 - Create a new Firebase Project and name it accordingly.
 - Navigate to Project Overview - Project Settings - General and create a new web app.
 - Navigate to Project Overview - Project Settings - Service Accounts and generate new private key
 - Navigate to Develop - Authentication - Users - Set up sign-in method - Google - enable - check that Web SDK configuration is filled in.
 - Keep this browser tab open

## Google Api Console

- Create a Project
- Enable [HomeGraph API](https://console.developers.google.com/apis/api/homegraph.googleapis.com/)
- Under 'OAuth 2.0 Client IDs' click your webclient credentials
- Add under URIs your Heroku url eg https://XXXXXXXXX.herokuapp.com
- Keep this browser tab open

## Google Actions

- Create a project
- Choose 'Smart Home'
- Name your Action
- Go back to Overview and Setup Account Linking 
	- Linking Type: OAuth - Authorization Code
	- Client ID: this is your Client Id from Google API Console ('OAuth 2.0 Client IDs' click your webclient credentials)
	- Client secret: this is your Client Secret from Google API Console ('OAuth 2.0 Client IDs' click your webclient credentials)
	- Authorization URL - https://XXXXXXXXX.herokuapp.com/oauth
	- Token URL - https://XXXXXXXXX.herokuapp.com/oauth/token
	- Scopes (I added google-home-authcode / app-user because i saw those 2 somewhere in the code but I don't think they are needed) ?? @Andrei please confirm/deny
- Back in Overview click Add Actions
- Fulfillment URL - https://XXXXXXXXX.herokuapp.com/smarthome/fulfill


## CONFIG.TS

 Pull the repo, and modify [src/config.ts](https://github.com/andrei-tatar/nora-service/blob/master/src/config.ts)

    export const oauthClientId = 'api console - credentials - oauth 2.0 client ids - web client - Client ID';
    export const oauthClientSecret = 'api console - credentials - oauth 2.0 client ids - web client - Client secret';
    export const googleProjectApiKey = 'api console - credentials - api keys - key';
    export const serviceAccount = {
        project_id: 'downloaded service account json from firebase',
        client_email: 'downloaded service account json from firebase',
        private_key: 'downloaded service account json from firebase'
    };

    apiKey: 'firebase - settings -general - your apps',
    authDomain: 'firebase - settings -general - your apps',
    databaseURL: 'firebase - settings -general - your apps',
    projectId: 'firebase - settings -general - your apps',
    storageBucket: 'firebase - settings -general - your apps',
    messagingSenderId: 'firebase - settings -general - your apps',


## USER.REPOSITORY.TS
Modify [src/services/user.repository.ts](https://github.com/andrei-tatar/nora-service/blob/master/src/services/user.repository.ts)

Not  sure if there is another way ([Andrei](https://github.com/andrei-tatar) please confirm/deny) but to create the Database Tables I had to modify this lines

    (async function () {
        const service = new PostgressService();
        await service.query(`
            CREATE TABLE IF NOT EXISTS appuser (
                uid VARCHAR(30) CONSTRAINT pk PRIMARY KEY,
                linked boolean DEFAULT false
            )`
        );
    
        await service.query('ALTER TABLE appuser ADD COLUMN IF NOT EXISTS noderedversion integer DEFAULT 1');
    	await service.query('ALTER TABLE appuser ADD COLUMN IF NOT EXISTS refreshtoken integer DEFAULT 1');
    })().catch(err => {
        console.error(err);
    }).then(() => {
        console.log('done');
    });


## PUSH

I think THAT'S IT, you are ready to deploy to Heroku! 
I would suggest to build the app and the  schema (just to check we didn't mess up [Andrei's](https://github.com/andrei-tatar) code :grimacing:) with `npm run build && npm run schema` before deploying.
To deploy follow the instructions from the Heroku website or if you linked your account in Heroku with Github just push to github.

## README DISCLAIMER

The steps above are just a lot of try-error from my side ([nicandris](https://github.com/nicandris)). I might have forgotten to document some stuff, or maybe I even added not-needed steps. Please try this guide and let me know what doesn't work or what's missing and I can fill it in later on.