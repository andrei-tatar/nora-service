import { State } from './state';

export interface VolumeState extends State {
    /**
     * @minimum 0
     * @maximum 100
     */
    currentVolume: number;
    isMuted: boolean;
}
