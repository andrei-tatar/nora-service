export class AggregateError extends Error {
    constructor(readonly errors: Error[]) {
        super('aggregate error');
    }
}

