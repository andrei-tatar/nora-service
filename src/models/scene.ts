import { BaseDevice, State } from './device';

export type SceneDevice = BaseDevice & {
    type: 'scene';
    state: State;
    sceneReversible: boolean;
};
