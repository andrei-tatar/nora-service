import { sign, SignOptions, verify, VerifyOptions } from 'jsonwebtoken';
import { jwtSecret } from '../config';

export class JwtService {
    sign(payload: any, key = jwtSecret, options?: SignOptions) {
        return new Promise<string>((resolve, reject) => sign(payload, key, options, (err, token) => {
            if (err) { reject(err); } else { resolve(token); }
        }));
    }

    verify<T = any>(token: string, options?: VerifyOptions) {
        return new Promise<T>((resolve, reject) => verify(token, jwtSecret, options, (err, decoded) => {
            if (err) { reject(err); } else { resolve(decoded as any); }
        }));
    }
}
