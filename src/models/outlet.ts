import { BaseDevice } from './device';
import { SwitchState } from './switch';

export type OutletDevice = BaseDevice & {
    type: 'outlet';
    state: SwitchState;
};

