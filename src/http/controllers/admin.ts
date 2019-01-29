import { userAdminUid } from '../../config';
import { DevicesRepository } from '../../services/devices.repository';
import { Http } from '../decorators/http';
import { authFilter } from '../middlewares/auth';
import { Controller } from './controller';

@Http.controller('/admin')
@Http.filter(authFilter({ scope: 'app-user', uid: userAdminUid, redirectToLogin: true }))
export class AdminController extends Controller {

    constructor(
        private devices: DevicesRepository,
    ) {
        super();
    }

    @Http.get()
    get() {
        const userIds = Object.keys(this.devices.onlineUsers);
        return {
            onlineUsers: Object.keys(this.devices.onlineUsers).length,
            connections: userIds.map(id => Object.keys(this.devices.onlineUsers[id]).length).reduce((sum, count) => sum + count, 0),
        };
    }
}
