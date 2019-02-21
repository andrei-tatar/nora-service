import { BaseDevice } from './device';
import { OnOffState } from './states/onoff';
import { VolumeState } from './states/volume';

export type SpeakerDevice = BaseDevice & {
    type: 'speaker';
    state: VolumeState & OnOffState;
    /**
     * @minimum 1
     * @maximum 50
     */
    relativeVolumeStep?: number;
};
