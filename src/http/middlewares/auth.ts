import { NextFunction, Request, Response } from 'express';
import { jwtCookieName } from '../../config';
import { JwtService } from '../../services/jwt.service';
import { UserToken } from '../controllers/login';
import { NotAuthorizedError } from './exception';

/*
declare module 'express' {
    export interface Request {
        token?: UserToken;
    }
}
*/

export function authMiddleware() {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            let authToken = req.cookies[jwtCookieName];
            if (!authToken) {
                const authHeader = req.header('Authorization');
                if (authHeader) {
                    const parts = authHeader.split(' ');
                    if (parts.length === 2 && parts[0] === 'Bearer') {
                        authToken = parts[1];
                    }
                }
            }

            if (authToken) {
                const jwt = req.container.resolve(JwtService);
                const token = await jwt.verify<UserToken>(authToken);
                req.token = token;
            }
        } catch (err) {
        }
        next();
    };
}

export function authFilter({ scope, uid, redirectToLogin = false }: { scope?: string, uid?: string, redirectToLogin?: boolean } = {}) {
    return () => (req: Request, res: Response, next: NextFunction) => {
        if (!req.token ||
            scope && req.token.scope !== scope ||
            uid !== void 0 && req.token.uid !== uid) {
            if (redirectToLogin) {
                const redirect = Buffer.from(req.originalUrl).toString('base64');
                return res.redirect('/login?redirect=' + redirect);
            } else {
                throw new NotAuthorizedError('user not allowed: ' + JSON.stringify(req.token || {}));
            }
        }
        next();
    };
}

