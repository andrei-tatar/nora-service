import { BaseDevice } from './device';
import { CameraStreamState } from './states/camerastream';

export type CameraDevice = BaseDevice & {
  type: 'camera';
  state: CameraStreamState;
};
