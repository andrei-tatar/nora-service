import { Inject, Lazy } from '@andrei-tatar/ts-ioc';
import * as config from '../../config';
import { FirebaseService } from '../../services/firebase.service';
import { JwtService } from '../../services/jwt.service';
import { NoderedTokenService } from '../../services/nodered-token.service';
import { UserRepository } from '../../services/user.repository';
import { delay } from '../../util';
import { Http } from '../decorators/http';
import { Param } from '../decorators/param';
import { Controller } from './controller';

@Http.controller('/login')
export class LoginController extends Controller {
    constructor(
        @Inject(UserRepository)
        private userRepository: Lazy<UserRepository>,
        @Inject(JwtService)
        private jwtService: Lazy<JwtService>,
        @Inject(FirebaseService)
        private firebase: Lazy<FirebaseService>,
        @Inject(NoderedTokenService)
        private nrtokenService: Lazy<NoderedTokenService>
    ) {
        super();
    }

    @Http.get('/init.js')
    async getInitJs() {
        const templateInitJs = function(firebase: any, fbConfig: any) {
            if (typeof firebase === 'undefined') {
                throw new Error('hosting/init-error: Firebase SDK not detected. You must include it before /__/firebase/init.js');
            }
            firebase.initializeApp(fbConfig);
        };
        return {
            contentType: 'text/javascript; charset=utf-8',
            body: `(${templateInitJs.toString()})(firebase, ${JSON.stringify(config.fireBase, null, 2)});`
        };
    }

    @Http.get()
    async getLoginTemplate(@Param.queryString() query: string) {
        return await this.renderTemplate('login', {
            query: query ? '?' + query : '',
            fireBase: {
                ...config.fireBase
            }
        });
    }

    @Http.post()
    async doLogin(
        @Param.fromBody('token') firebaseToken: string,
        @Param.fromQuery('redirect') redirect: string,
        @Param.queryString() query: string
    ) {
        await delay(500);
        try {
            const decoded = await this.firebase.value.verifyToken(firebaseToken);
            await this.userRepository.value.createUserRecordIfNotExists(decoded.uid);
            const token: UserToken = {
                uid: decoded.uid,
                exp: Math.round((new Date().getTime() + 3600000) / 1000),
                scope: 'app-user',
                nodered: await this.nrtokenService.value.generateToken(decoded.uid)
            };

            const tokenStr = await this.jwtService.value.sign(token);
            this.response.cookie(config.jwtCookieName, tokenStr, {
                secure: config.secureCookie
            });

            if (typeof redirect === 'string') {
                const redirectUri = Buffer.from(redirect, 'base64').toString();
                return this.response.redirect(redirectUri);
            }
            return this.response.redirect('/');
        } catch (err) {
            console.warn('login: ', err);
            return this.response.redirect(`/login${query ? '?' + query : ''}`);
        }
    }
}

export interface UserToken {
    uid: string;
    exp: number;
    scope: string;
    nodered?: string;
}
