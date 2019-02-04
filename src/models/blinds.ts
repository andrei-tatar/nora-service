import { BaseDevice } from './device';
import { OpenCloseState } from './states/openclose';

export type BlindsDevice = BaseDevice & {
    type: 'blinds';
    state: OpenCloseState;
};
