import { Container } from '@andrei-tatar/ts-ioc';
import { Socket } from 'socket.io';

export function childContainerMiddleware(container: Container) {
    return (socket: Socket, next: (err?: any) => void) => {
        socket.container = container.createChild();
        socket.container.register({ token: 'socket', useValue: socket });
        socket.container.register({ token: 'uid', useFactory: () => socket.uid });
        socket.container.register({ token: 'notify', useValue: socket.handshake.query.notify === 'true' });
        socket.container.register({ token: 'group', useValue: (socket.handshake.query.group || '').substr(0, 5) });
        socket.container.register({ token: 'local', useValue: socket.handshake.query.local === 'true' });
        socket.once('disconnect', () => {
            try {
                socket.container.destroy();
                delete socket.container;
            } catch {
            }
        });
        return next();
    };
}

declare module 'socket.io' {
    export interface Socket {
        container: Container;
    }
}
