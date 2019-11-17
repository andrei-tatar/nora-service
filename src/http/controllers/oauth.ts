import * as crypto from 'crypto';
import { jwtSecret, oauthClientId, oauthClientSecret, projectId } from '../../config';
import { JwtService } from '../../services/jwt.service';
import { UserRepository } from '../../services/user.repository';
import { Http } from '../decorators/http';
import { Param } from '../decorators/param';
import { BadRequestError, NotAuthorizedError } from '../middlewares/exception';
import { Controller } from './controller';
import { UserToken } from './login';
interface AuthToken {
  exp: number;
  scope: string;
  uid: string;
}

@Http.controller('/oauth')
export class OauthController extends Controller {

  readonly expireTimeSeconds = 3600;

  constructor(
    private jwtService: JwtService,
    private userRepo: UserRepository,
  ) {
    super();
  }

  @Http.get('/auth')
  async authorizeGoogle(
    @Param.fromQuery('yes') yes: string,
    @Param.fromQuery('no') no: string,
  ) {
    const yesLink = Buffer.from(yes, 'base64').toString();
    const noLink = Buffer.from(no, 'base64').toString();
    return this.renderTemplate('oauth', { yesLink, noLink });
  }

  @Http.get()
  async getAuthCode(
    @Param.fromQuery('client_id') clientId: string,
    @Param.fromQuery('redirect_uri') redirectUri: string,
    @Param.fromQuery('response_type') responseType: string,
    @Param.fromQuery('state') state: string,
    @Param.fromQuery('confirm') confirm: boolean = false,
    @Param.fromQuery('auth') auth: boolean = false,
  ) {
    if (clientId !== oauthClientId) {
      throw new BadRequestError('invalid client_id');
    }

    if (!redirectUri || !redirectUri.startsWith(`https://oauth-redirect.googleusercontent.com/r/${projectId}`)) {
      throw new BadRequestError('invalid redirect_uri');
    }

    if (responseType !== 'code') {
      throw new BadRequestError('response_type must be "code"');
    }

    if (!confirm || !this.request.token || this.request.token.scope !== 'app-user') {
      const redirectPath = `/oauth?confirm=true&` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=${encodeURIComponent(responseType)}&` +
        `state=${encodeURIComponent(state)}`;
      const encoded = Buffer.from(redirectPath).toString('base64');

      return this.response.redirect(`/login?redirect=${encoded}`);
    }

    if (!auth) {
      const parms = `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=${encodeURIComponent(responseType)}&` +
        `state=${encodeURIComponent(state)}`;

      const redirectYes = `/oauth?confirm=true&auth=true&${parms}`;
      const encodedYes = Buffer.from(redirectYes).toString('base64');
      const redirectNo = `/oauth?${parms}`;
      const encodedNo = Buffer.from(redirectNo).toString('base64');
      return this.response.redirect(`/oauth/auth?yes=${encodedYes}&no=${encodedNo}`);
    }

    const authToken: AuthToken = {
      exp: Math.round(new Date().getTime() / 1000) + 600, // 10 min
      scope: 'google-home-authcode',
      uid: this.request.token.uid,
    };
    const authCode = await this.jwtService.sign(authToken);
    return this.response.redirect(`${redirectUri}?state=${state}&code=${authCode}`);
  }


  @Http.post('/token')
  async handleToken(
    @Param.fromBody('client_id') clientId: string,
    @Param.fromBody('client_secret') clientSecret: string,
    @Param.fromBody('grant_type') grantType: string,
    @Param.fromBody('code') code: string,
    @Param.fromBody('refresh_token') refreshToken: string,
  ) {
    if (clientId !== oauthClientId || clientSecret !== oauthClientSecret) {
      throw new Error('invalid client id or secret');
    }

    switch (grantType) {
      case 'authorization_code':
        const authToken = await this.jwtService.verify<AuthToken>(code);
        if (authToken.scope !== 'google-home-authcode') {
          throw new BadRequestError('invalid_scope');
        }

        await this.userRepo.updateUserLinked(authToken.uid, true);
        console.info(`user ${authToken.uid} linked to google home`);

        return {
          token_type: 'Bearer',
          access_token: await this.generateAccessToken(authToken.uid),
          refresh_token: await this.generateRefreshToken(authToken.uid),
          expires_in: this.expireTimeSeconds,
        };

      case 'refresh_token':
        return {
          token_type: 'Bearer',
          access_token: await this.generateAccessTokenFromRefreshToken(refreshToken),
          expires_in: this.expireTimeSeconds,
        };

      default:
        throw new BadRequestError('invalid_grant');
    }
  }

  private async generateAccessToken(uid: string) {
    const user: UserToken = {
      uid,
      exp: Math.round(new Date().getTime() / 1000) + this.expireTimeSeconds, // 60 min,
      scope: 'google-home-auth',
    };
    const token = await this.jwtService.sign(user);
    return token;
  }

  private async generateRefreshToken(uid: string) {
    // tslint:disable-next-line: deprecation
    const cipher = crypto.createCipher('aes-256-ctr', jwtSecret);
    const refresh = await this.userRepo.getRefreshToken(uid);
    let crypted = cipher.update(`${refresh}:${uid}`, 'utf8', 'base64');
    crypted += cipher.final('base64');
    return crypted;
  }

  private async generateAccessTokenFromRefreshToken(refreshToken: string) {
    // tslint:disable-next-line: deprecation
    const decipher = crypto.createDecipher('aes-256-ctr', jwtSecret);
    let dec = decipher.update(refreshToken, 'base64', 'utf8');
    dec += decipher.final('utf8');
    const parts = dec.split(':');
    if (parts.length !== 2) {
      throw new NotAuthorizedError('invalid refresh token');
    }

    const refresh = parseInt(parts[0], 10);
    if (typeof refresh !== 'number' || !isFinite(refresh)) {
      throw new NotAuthorizedError('invalid refresh token');
    }

    const uid = parts[1];
    if (refresh !== await this.userRepo.getRefreshToken(uid)) {
      throw new NotAuthorizedError('refresh token revoked');
    }

    return await this.generateAccessToken(uid);
  }
}
