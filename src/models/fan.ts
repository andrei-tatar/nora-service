import { BaseDevice } from './device';
import { OnOffState } from './states/onoff';
import ( fanSpeedState, availableFanSpeeds ) from './states/fanspeed';

export type FanDevice = BaseDevice & {
    type: 'fan';
    fanSpeedControl: false;
    state: OnOffState;
};

export type FanDeviceWithFanSpeed = BaseDevice & {
    type: 'fan`';
    availableSpeeds: availableFanSpeeds[];
    fanSpeedControl: true;
    state: FanSpeeedState & OnOffState;
};