import { Device, StateChanges } from '../nora-common/models';

export interface SyncDevices {
    [id: string]: Device;
}

export type UpdateDevices = StateChanges;
