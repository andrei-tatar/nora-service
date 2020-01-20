import { Server } from 'http';
import * as createSocketServer from 'socket.io';

import { Container } from '@andrei-tatar/ts-ioc';
import { ConnectionHandler } from './connectionhandler';
import { registerBindedEvents } from './decorators/bindevent';
import { authenticationMiddleware } from './middlewares/authentication.middleware';
import { childContainerMiddleware } from './middlewares/childcontainer.middleware';
import { oneConnectionPerUserMiddleware } from './middlewares/one-connection-per-user.middleware';

export function initWebSocketListener(server: Server, container: Container) {
    const io = createSocketServer(server, {
        serveClient: false,
        pingInterval: 10000,
        pingTimeout: 5000,
    });
    io.use(childContainerMiddleware(container));
    io.use(authenticationMiddleware());
    io.use(oneConnectionPerUserMiddleware());
    io.on('connect', socket => {
        try {
	    io.on("*", (event,data) => {
              console.log(event);
              console.log(data);
            });
            const instance = socket.container.resolve(ConnectionHandler);
            registerBindedEvents(instance, socket);
        } catch (err) {
            console.warn(`unhandled error in socket connect`, err);
        }
    });
}
