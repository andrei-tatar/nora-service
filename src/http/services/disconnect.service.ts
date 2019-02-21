import { Inject } from '@andrei-tatar/ts-ioc';
import { UserRepository } from '../../services/user.repository';

export class DisconnectService {
    constructor(
        @Inject('uid')
        private uid: string,
        private userRepo: UserRepository,
    ) {
    }

    async disconnect() {
        await this.userRepo.updateUserLinked(this.uid, false);
        console.info(`user ${this.uid} unlinked from google home`);
    }
}

