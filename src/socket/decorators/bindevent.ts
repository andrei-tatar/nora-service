import { Socket } from 'socket.io';

const bindEventsKey = Symbol('bind:events');

export function BindEvent(event?: string, { once = false }: { once?: boolean } = {}) {
    return (target, key: string) => {
        const bindedEvents = getBindedEvents(target);
        bindedEvents.push({ event: event || key, method: key, once });
        Reflect.defineMetadata(bindEventsKey, bindedEvents, target);
    };
}

function getBindedEvents(target) {
    return (
        (Reflect.getMetadata(bindEventsKey, target) as {
            method: string;
            event: string;
            once: boolean;
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
        if (event.once) {
            socket.once(event.event, (...args: any[]) => {
                // console.log('ONCE:', event.event, ...args);
                handler(...args);
            });
        } else {
            socket.on(event.event, (...args: any[]) => {
                // console.log('ON:', event.event, ...args);
                handler(...args);
            });
        }
    }
}
