
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
- Back in Overview click Add Actions
- Fulfillment URL - https://XXXXXXXXX.herokuapp.com/smarthome/fulfill


## CONFIG HEROKU ENV VARS

In Heroku go to Settings - Config Vars and add

![env vars](https://user-images.githubusercontent.com/6473183/80377036-5d9f7700-88a3-11ea-8a55-c63bb6442268.png)

    JWT_COOKIE = nora:auth
    JWT_SECRET = downloaded service account json from firebase - private_key
    OAUTH_ID = api console - credentials - oauth 2.0 client ids - web client - Client ID
    OAUTH_SECRET = api console - credentials - oauth 2.0 client ids - web client - Client secret
    OAUTH_PROJECT_ID = firebase - settings -general - your apps - project id
    PROJECT_API_KEY = api console - credentials - api keys - key
    PROJECT_ID = firebase - settings -general - your apps - project id
    SERVICE_ACCOUNT_ISSUER =  downloaded service account json from firebase - client_email
    SERVICE_ACCOUNT_KEY =  downloaded service account json from firebase - private_key

## USER.REPOSITORY.TS
Modify [src/services/user.repository.ts](https://github.com/andrei-tatar/nora-service/blob/master/src/services/user.repository.ts)

To create the Database Tables modify this lines:

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

THAT'S IT, you are ready to deploy to Heroku! 
Build the app and the  schema with `npm run heroku-postbuild` before deploying.
To deploy follow the instructions from the Heroku website or if you linked your account in Heroku with Github just push to github.

## README DISCLAIMER

The instructions might be incomplete. For issues with the instructions please create an issue and we'll take another look,
