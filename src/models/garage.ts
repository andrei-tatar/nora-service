import { BaseDevice } from './device';
import { OpenCloseState } from './states/openclose';

export type GarageDevice = BaseDevice & {
    type: 'garage';
    state: OpenCloseState;
};
