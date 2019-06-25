import { Injectable } from '@andrei-tatar/ts-ioc';
import { JwtService } from './jwt.service';
import { UserRepository } from './user.repository';

interface NoderedToken {
    uid: string;
    scope: 'node-red';
    version: number;
}

@Injectable()
export class NoderedTokenService {
    constructor(
        private jwtService: JwtService,
        private userRepo: UserRepository,
    ) {
    }

    async generateToken(uid: string) {
        const token: NoderedToken = {
            uid: uid,
            scope: 'node-red',
            version: await this.userRepo.getNodeRedTokenVersion(uid),
        };
        return this.jwtService.sign(token);
    }

    async validateToken(token: string) {
        const decoded = await this.jwtService.verify<NoderedToken>(token);
        if (decoded.scope !== 'node-red') {
            throw new Error('invalid scope');
        }
        const version = await this.userRepo.getNodeRedTokenVersion(decoded.uid);
        if (version !== decoded.version) {
            throw new Error('token revoked');
        }
        return decoded.uid;
    }
}
