import { BaseDevice } from './device';
import { SwitchState } from './switch';

export interface LightState extends SwitchState {
    /**
     * @minimum 0
     * @maximum 100
     */
    brightness: number;
}

export interface LightColorState extends LightState {
    color: {
        spectrumHsv: {
            /**
             * @minimum 0
             * @maximum 360
             */
            hue: number;
            /**
             * @minimum 0
             * @maximum 1
             */
            saturation: number;
            /**
             * @minimum 0
             * @maximum 1
             */
            value: number;
        };
    };
}

export type LightDevice = BaseDevice & {
    type: 'light';
    brightnessControl: false;
    colorControl?: false;
    state: SwitchState;
};

export type LightDeviceWithBrightness = BaseDevice & {
    type: 'light';
    brightnessControl: true;
    colorControl?: false;
    state: LightState;
};

export type LightDeviceWithColor = BaseDevice & {
    type: 'light';
    brightnessControl: true;
    colorControl: true;
    state: LightColorState;
};
