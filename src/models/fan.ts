import { BaseDevice } from './device';
import { OnOffState } from './states/onoff';
import ( fanSpeedState ) from './states/fanspeed';

export type FanDevice = BaseDevice & {
    type: 'fan';
    fanSpeedControl: false;
    state: OnOffState;
};

export type FanDeviceWithFanSpeed = BaseDevice & {
    type: 'fan`';
	availableSpeeds: availableFanSpeed[];
    fanSpeedControl: true;
    state: FanSpeeedState & OnOffState;
};