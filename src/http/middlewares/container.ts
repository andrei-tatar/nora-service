import { Container } from '@andrei-tatar/ts-ioc';
import { NextFunction, Request, Response } from 'express';

declare module 'express' {
    export interface Request {
        container: Container;
    }
}

export function containerMiddleware(container: Container) {
    return (req: Request, res: Response, next: NextFunction) => {
        req.container = container.createChild();
        req.container.register({ token: 'request', useValue: req });
        req.container.register({ token: 'response', useValue: res });
        req.container.register({ token: 'uid', useFactory: () => req.token.uid });
        next();
    };
}

export function destroyContainerMiddleware() {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            req.container.destroy();
            delete req.container;
        } catch {
        }
        next();
    };
}
