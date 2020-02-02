import 'reflect-metadata';

import * as http from 'http';
import * as https from 'https';
import { serviceSockets } from './config';
import { container } from './container';
import { app } from './http/app';
import { initWebSocketListener } from './socket';

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
