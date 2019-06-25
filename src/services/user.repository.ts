import { Injectable } from '@andrei-tatar/ts-ioc';
import { Subject } from 'rxjs';
import { PostgressService } from './postgress.service';

@Injectable()
export class UserRepository {
    private userBlocked = new Subject<string>();

    readonly userBlocked$ = this.userBlocked.asObservable();

    constructor(
        private postgress: PostgressService,
    ) {
    }

    async createUserRecordIfNotExists(uid: string) {
        await this.postgress.query(`INSERT INTO appuser (uid) VALUES ($1) ON CONFLICT DO NOTHING`, uid);
    }

    async getUser(uid: string) {
        const [user] = await this.postgress.query<User>(`SELECT * FROM appuser WHERE uid = $1`, uid);
        if (!user) { throw new Error('user does not exist'); }
        return user;
    }

    async isUserLinked(uid: string) {
        const rows = await this.postgress.query<User>('select linked from appuser where uid = $1', uid);
        if (rows && rows.length === 1) { return rows[0].linked; }
        return false;
    }

    async updateUserLinked(uid: string, linked: boolean) {
        await this.postgress.query(`UPDATE appuser SET linked = $1 WHERE uid = $2`, linked, uid);
    }

    async getRefreshToken(uid: string): Promise<number | null> {
        const rows = await this.postgress.query<User>(`SELECT refreshToken FROM appuser WHERE uid = $1`, uid);
        if (rows && rows.length === 1) { return rows[0].refreshtoken; }
        return null;
    }

    async getNodeRedTokenVersion(uid: string): Promise<number> {
        const rows = await this.postgress.query<User>(`SELECT noderedversion FROM appuser WHERE uid = $1`, uid);
        if (rows && rows.length === 1) { return rows[0].noderedversion; }
        return 1;
    }

    async incrementNoderedTokenVersion(uid: string): Promise<void> {
        await this.postgress.query(`UPDATE appuser SET noderedversion = noderedversion + 1 WHERE uid = $1`, uid);
    }
}

// (async function () {
//     const service = new PostgressService();
//     // await service.query(`
//     //     CREATE TABLE IF NOT EXISTS appuser (
//     //         uid VARCHAR(30) CONSTRAINT pk PRIMARY KEY,
//     //         linked boolean DEFAULT false
//     //     )`
//     // );

//     // await service.query('ALTER TABLE appuser ADD COLUMN noderedversion integer DEFAULT 1');
//     const repo = new UserRepository(service);
//     // await repo.incrementNoderedTokenVersion('ARcEql2ileYghxMOstan2bOsSEj1');
//     // const users = await service.query('select * from appuser');

//     console.log(await repo.getUser('ARcEql2ileYghxMOstan2bOsSEj1'));

// })().catch(err => {
//     console.error(err);
// }).then(() => {
//     console.log('done');
// });

export interface User {
    readonly uid: string;
    refreshtoken: number;
    noderedversion: number;
    linked: boolean;
}
