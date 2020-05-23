import { Intent } from './intent';
import { FulfillPayload } from './response';

export interface SyncInput {
    intent: Intent.Sync;
}

export interface SyncPayload extends FulfillPayload {
    agentUserId: string;
    devices: SyncDevice[];
}

export interface SyncDevice {
    id: string;
    type: DeviceTypes;
    traits: Traits[];
    name: {
        defaultNames?: string[];
        name: string;
        nicknames?: string[];
    };
    willReportState: boolean;
    notificationSupportedByAgent?: boolean;
    roomHint?: string;
    deviceInfo?: {
        manufacturer: string;
        model: string;
        hwVersion: string;
        swVersion: string;
    };
    otherDeviceIds?: {
        agentId?: string;
        deviceId: string;
    }[];
    attributes?: any;
    customData?: any;
}


export enum Traits {
    Brightness = 'action.devices.traits.Brightness',
    ColorSetting = 'action.devices.traits.ColorSetting',
    OnOff = 'action.devices.traits.OnOff',
    LockUnlock = 'action.devices.traits.LockUnlock',
    Scene = 'action.devices.traits.Scene',
    TemperatureSetting = 'action.devices.traits.TemperatureSetting',
    Volume = 'action.devices.traits.Volume',
    OpenClose = 'action.devices.traits.OpenClose',
}

export enum DeviceTypes {
    Light = 'action.devices.types.LIGHT',
    Switch = 'action.devices.types.SWITCH',
    Scene = 'action.devices.types.SCENE',
    Outlet = 'action.devices.types.OUTLET',
    Thermostat = 'action.devices.types.THERMOSTAT',
    Speaker = 'action.devices.types.SPEAKER',
    Blinds = 'action.devices.types.BLINDS',
    Garage = 'action.devices.types.GARAGE',
    Lock = 'action.devices.types.LOCK',
}
