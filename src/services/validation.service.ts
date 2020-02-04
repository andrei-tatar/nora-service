import Ajv from 'ajv';
import { join } from 'path';

export class ValidationService {
    private ajv = new Ajv();
    private cachedValidators: { [schemaName: string]: Ajv.ValidateFunction } = {};

    validate(schemaName: string, object: any) {
        let validator = this.cachedValidators[schemaName];
        if (!validator) {
            const schema = require(join(__dirname, '..', '..', 'schema', schemaName));
            this.cachedValidators[schemaName] = validator = this.ajv.compile(schema);
        }

        const valid = validator(object);
        if (!valid) {
            throw new Error(`invalid object for ${schemaName}`);
        }
    }
}
