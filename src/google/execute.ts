import { Intent } from './intent';
import { FulfillPayload } from './response';

export interface ExecuteInput {
    intent: Intent.Execute;
    payload: {
        commands: ExecuteCommand[];
    };
}

export enum ExecuteCommandTypes {
    OnOff = 'action.devices.commands.OnOff',
    Brightness = 'action.devices.commands.BrightnessAbsolute',
    ActivateScene = 'action.devices.commands.ActivateScene',
    ColorAbsolute = 'action.devices.commands.ColorAbsolute',
    ThermostatTemperatureSetpoint = 'action.devices.commands.ThermostatTemperatureSetpoint',
    ThermostatTemperatureSetRange = 'action.devices.commands.ThermostatTemperatureSetRange',
    ThermostatSetMode = 'action.devices.commands.ThermostatSetMode',
    TemperatureRelative = 'action.devices.commands.TemperatureRelative',
    SetVolume = 'action.devices.commands.setVolume',
    VolumeRelative = 'action.devices.commands.volumeRelative',
    OpenClose = 'action.devices.commands.OpenClose',
    LockUnlock = 'action.devices.commands.LockUnlock',
    SetFanSpeed = 'action.devices.commands.SetFanSpeed',
}

export interface ExecuteCommand {
    devices: Array<{
        id: string;
        customData?: any;
    }>;
    execution: CommandExecution[];
}

export interface CommandExecution {
    command: ExecuteCommandTypes;
    params: {
        [param: string]: any;
    };
    challenge?: {
        ack?: boolean;
        pin?: string;
    };
}

export interface ExecutePayload extends FulfillPayload {
    commands: ExecutePayloadCommand[];
}

export interface ExecutePayloadCommand {
    ids: string[];
    status: ExecuteStatus;
    errorCode?: string;
    debugString?: string;
    states?: {
        online: boolean;
        [param: string]: boolean | number | string;
    };
    challengeNeeded?: { type: 'pinNeeded' | 'ackNeeded' | 'challengeFailedPinNeeded' };
}

export enum ExecuteStatus {
    success = 'SUCCESS',
    pending = 'PENDING',
    offline = 'OFFLINE',
    error = 'ERROR',
}
