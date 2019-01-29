export class Lazy<T> {
    private _value: T;
    private _created = false;

    get value() {
        if (!this._created) {
            this._created = true;
            this._value = this.factory();
            delete this.factory;
        }
        return this._value;
    }

    constructor(
        private factory: () => T
    ) {
    }
}
