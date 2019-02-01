import { BaseDevice, State } from './device';

export interface SpeakerState extends State {
    on: boolean;
    /**
     * @minimum 0
     * @maximum 100
     */
    currentVolume: number;
    isMuted: boolean;
}

export type SpeakerDevice = BaseDevice & {
    type: 'speaker';
    state: SpeakerState;
    relativeVolumeStep?: number;
};
