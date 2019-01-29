import { NextFunction, Request, Response } from 'express';

export class NotAuthorizedError extends Error {
    constructor(message?: string) {
        super(message || 'not authorized');
    }
}

export class BadRequestError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

export function exceptionMiddleware() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof NotAuthorizedError) {
            console.warn(`unauth access to ${req.url}`, err);
            res.status(401).json({ error: err.message });
        } else if (err instanceof BadRequestError) {
            console.warn(`bad req ${req.url}`, err);
            res.status(400).json({ error: err.message });
        } else {
            console.error(`error ${req.url}\n${err.message}\n\n${err.stack}`);
            res.status(500).json({ error: err.message });
        }
        next();
    };
}
