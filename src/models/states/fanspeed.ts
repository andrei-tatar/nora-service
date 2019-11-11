import { State } from './state';

export type availableFanSpeeds = 'off' | 'low' | 'medium' | 'high';

export interface FanSpeedState extends State {
     availableFanSpeeds: availableFanSpeeds;
}
