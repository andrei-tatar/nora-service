import 'reflect-metadata';

import * as http from 'http';
import * as https from 'https';
import * as process from 'process';
import { serviceSockets } from './config';
import { container } from './container';
import { app } from './http/app';
import { initWebSocketListener } from './socket';
import * as functions from 'firebase-functions';

const  fireBaseExports: any = {};
export = fireBaseExports;

if (typeof process.env.FIREBASE_CONFIG === 'undefined') {
  serviceSockets.forEach(srv => {
    const server = srv.tls ? https.createServer(srv.tls, app) : http.createServer(app);
    initWebSocketListener(server, container);
    server.listen({
      port: srv.port,
      address: srv.address
    }, () =>
      console.log(`listening ${srv.tls ? 'https' : 'http'} on ${srv.address ? '['+srv.address+'] ': ''}${srv.port}`)
    );
  });
} else {
  console.log('FireBase-Mode');
  // // Start writing Firebase Functions
  // // https://firebase.google.com/docs/functions/typescript
  //
  fireBaseExports.nora  = functions.https.onRequest((request, response) => {
    console.log('fireBaseRequest:', request.path);
    app(request, response);
//    response.send(`Hello from nora!
//                  <code>${JSON.stringify(process.env, null, 2)}</code>
//                  <code>${request}</code>
//                  `);
  });
}

