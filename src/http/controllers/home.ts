import { Http } from '../decorators/http';
import { Controller } from './controller';

@Http.controller('/')
export class HomeController extends Controller {

    @Http.get()
    async get() {
        if (!this.request.token) {
            return this.response.redirect('/login');
        }

        const token = await this.request.token.nodered;
        return await this.renderTemplate('home', { token });
    }

    @Http.get('/privacy')
    async getPrivacyPolicy() {
        return await this.renderTemplate('home-privacy');
    }
}
