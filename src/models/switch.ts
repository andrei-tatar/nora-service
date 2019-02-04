import { BaseDevice } from './device';
import { OnOffState } from './states/onoff';

export type SwitchDevice = BaseDevice & {
    type: 'switch';
    state: OnOffState;
};
