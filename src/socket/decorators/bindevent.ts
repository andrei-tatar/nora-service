import { Socket } from 'socket.io';

const bindEventsKey = Symbol('bind:events');

export function BindEvent(event?: string) {
    return (target, key: string) => {
        const bindedEvents = getBindedEvents(target);
        bindedEvents.push({ event: event || key, method: key });
        Reflect.defineMetadata(bindEventsKey, bindedEvents, target);
    };
}

function getBindedEvents(target) {
    return (
        (Reflect.getMetadata(bindEventsKey, target) as {
            method: string;
            event: string;
        }[]) || []
    );
}

export function registerBindedEvents(target, socket: Socket) {
    const binded = getBindedEvents(target);
    for (const event of binded) {
        const handler = async (...args: any[]) => {
            try {
                await Promise.resolve(target[event.method](...args));
            } catch (err) {
                const requestId = args.length && args[args.length - 1];
                if (typeof requestId === 'string' && requestId.startsWith('req:')) {
                    socket.emit('action-error', requestId, err.message);
                }
                console.warn(`unhandled error in binded event ${event.event} (uid: ${socket.uid})`, err, JSON.stringify(args));
            }
        };
        socket.on(event.event, (...args: any[]) => {
            handler(...args);
        });
    }
}
