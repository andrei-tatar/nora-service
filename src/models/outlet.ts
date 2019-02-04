import { BaseDevice } from './device';
import { OnOffState } from './states/onoff';

export type OutletDevice = BaseDevice & {
    type: 'outlet';
    state: OnOffState;
};

