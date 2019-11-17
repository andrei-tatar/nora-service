import { BlindsDevice } from './blinds';
import { GarageDevice } from './garage';
import { LightDevice, LightDeviceWithBrightness, LightDeviceWithColor } from './light';
import { LockDevice } from './lock';
import { OutletDevice } from './outlet';
import { SceneDevice } from './scene';
import { SpeakerDevice } from './speaker';
import { SwitchDevice } from './switch';
import { ThermostatDevice } from './thermostat';

export interface Devices {
    [id: string]: Device;
}

export type Device = SwitchDevice | LightDevice | LightDeviceWithBrightness |
    LightDeviceWithColor | SceneDevice | OutletDevice | ThermostatDevice |
    SpeakerDevice | BlindsDevice | GarageDevice | LockDevice;

export type AllStates = Device['state'];

export interface StateChanges {
    [deviceId: string]: Partial<AllStates>;
}
