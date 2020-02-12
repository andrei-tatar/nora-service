import * as admin from 'firebase-admin';
import { serviceAccount } from '../config';

export class FirebaseService {

    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey: serviceAccount.private_key,
            }),
        });
    }

    async verifyToken(token: string) {
        const decoded = await admin.auth().verifyIdToken(token);
        if (decoded.firebase.sign_in_provider === 'password') {
            if (decoded.uid !== 'SaZLefUTKJYSPTbb2PrZRsU0Sr33') {
                throw new Error('Only test user can login with e-mail/password');
            }
        }
        return {
            uid: decoded.uid,
            email: decoded.email as string,
            name: decoded.name as string,
        };
    }
}
