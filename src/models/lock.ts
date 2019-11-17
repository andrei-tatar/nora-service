import { BaseDevice } from './device';
import { LockUnlockState } from './states/lockunlock';

export type LockDevice = BaseDevice & {
    type: 'lock';
    state: LockUnlockState;
};

