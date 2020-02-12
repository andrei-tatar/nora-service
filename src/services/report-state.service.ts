import fetch from 'node-fetch';

import { Inject } from '@andrei-tatar/ts-ioc';
import { serviceAccount } from '../config';
import { StateChanges } from '../models';
import { delay } from '../util';
import { JwtService } from './jwt.service';
import { UserRepository } from './user.repository';

interface GoogleToken {
    token: string;
    expires: number;
}

export class ReportStateService {
    private static token: Promise<GoogleToken>;

    constructor(
        @Inject('uid')
        private uid: string,
        private jwtService: JwtService,
        private userRepo: UserRepository,
    ) {}

    async reportState(stateChanges: StateChanges, requestId?: string, tries = 3) {
        if (!(await this.userRepo.isUserLinked(this.uid))) {
            return null;
        }
        while (tries-- > 0) {
            const { url, fetchOptions, response } = await this.reportStateInternal(stateChanges, requestId);
            if (response.ok) {
                return;
            }
            if (response.status !== 404) {
                throw new Error(`while reportState (${this.uid}).
	              req: ${url} - ${JSON.stringify(fetchOptions, null, 2)}
		          status: ${response.status} - ${await response.text()}`);
            }
            await delay(20000);
        }
    }

    private async reportStateInternal(stateChanges: StateChanges, requestId?: string) {
        if (!ReportStateService.token || (await ReportStateService.token).expires < new Date().getTime()) {
            ReportStateService.token = this.getToken().catch(err => {
                delete ReportStateService.token;
                throw err;
            });
        }

        const token = await ReportStateService.token;
        const body = {
            requestId,
            agentUserId: this.uid,
            payload: {
                devices: {
                    states: stateChanges,
                },
            },
        };
        const fetchOptions = {
            method: 'post',
            body: JSON.stringify(body),
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${token.token}`,
                'X-GFE-SSL': 'yes',
            },
        };
        const url = `https://homegraph.googleapis.com/v1/devices:reportStateAndNotification`;
        console.log(`fetch: ${url}:`, JSON.stringify(fetchOptions, null, 2));
        const response = await fetch(url, fetchOptions);
        return { url, fetchOptions, response };
    }

    private async getToken() {
        const now = Math.round(new Date().getTime() / 1000);
        const jwt = {
            iss: serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/homegraph',
            aud: 'https://accounts.google.com/o/oauth2/token',
            iat: now,
            exp: now + 3600,
        };
        const token = await this.jwtService.sign(jwt, serviceAccount.private_key, { algorithm: 'RS256' });

        console.log('fetch: https://accounts.google.com/o/oauth2/token');
        const response = await fetch('https://accounts.google.com/o/oauth2/token', {
            method: 'post',
            body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(token)}`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                assertion: token,
                authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error(`whilte getToken status: ${response.status} - ${await response.text()}`);
        }

        const result: { access_token: string; expires_in: number } = await response.json();
        return {
            token: result.access_token,
            expires: new Date().getTime() + result.expires_in * 1000 - 5000,
        } as GoogleToken;
    }
}
