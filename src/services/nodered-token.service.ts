import { Injectable } from '@andrei-tatar/ts-ioc';
import { JwtService } from './jwt.service';

interface NoderedToken {
    uid: string;
    scope: 'node-red';
    version: number;
}

@Injectable()
export class NoderedTokenService {
    constructor(
        private jwtService: JwtService,
    ) {
    }

    generateToken(uid: string) {
        const token: NoderedToken = {
            uid: uid,
            scope: 'node-red',
            version: 1,
        };
        return this.jwtService.sign(token);
    }

    async validateToken(token: string) {
        const decoded = await this.jwtService.verify<NoderedToken>(token);
        if (decoded.scope !== 'node-red') {
            throw new Error('invalid scope');
        }
        return decoded.uid;
    }
}
