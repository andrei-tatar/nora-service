import { Device, StateChanges } from '../models';

export interface SyncDevices {
    [id: string]: Device;
}

export type UpdateDevices = StateChanges;
