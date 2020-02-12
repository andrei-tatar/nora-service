import { Pool } from 'pg';
import { postgres } from '../config';

export class PostgressService {
    readonly HOUR = 3600000;

    private pool = new Pool(postgres);

    async query<T = any>(query: string, ...values: any[]): Promise<T[]> {
        const result = await this.pool.query(query, values);
        return result.rows;
    }
}
