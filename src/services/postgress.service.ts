import { Pool } from 'pg';
import { postgressConnectionString } from '../config';

export class PostgressService {
    readonly HOUR = 3600000;

    private pool = new Pool({
        connectionString: postgressConnectionString,
        ssl: true,
        max: 5,
        idleTimeoutMillis: 4 * this.HOUR,
        connectionTimeoutMillis: 2000,
    });

    async query<T = any>(query: string, ...values: any[]): Promise<T[]> {
        const result = await this.pool.query(query, values);
        return result.rows;
    }
}
