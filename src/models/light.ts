import { BaseDevice } from './device';
import { BrightnessState } from './states/brightness';
import { ColorState } from './states/color';
import { OnOffState } from './states/onoff';

export type LightDevice = BaseDevice & {
    type: 'light';
    brightnessControl: false;
    colorControl?: false;
    state: OnOffState;
};

export type LightDeviceWithBrightness = BaseDevice & {
    type: 'light';
    brightnessControl: true;
    turnOnWhenBrightnessChanges?: boolean;
    colorControl?: false;
    state: BrightnessState & OnOffState;
};

export type LightDeviceWithColor = BaseDevice & {
    type: 'light';
    brightnessControl: true;
    turnOnWhenBrightnessChanges?: boolean;
    colorControl: true;
    state: ColorState & BrightnessState & OnOffState;
};
