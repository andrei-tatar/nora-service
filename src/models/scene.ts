import { BaseDevice } from './device';
import { State } from './states/state';

export type SceneDevice = BaseDevice & {
    type: 'scene';
    state: State;
    sceneReversible: boolean;
};
