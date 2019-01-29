import { DisconnectInput } from './disconnect';
import { ExecuteCommandTypes, ExecuteInput, ExecutePayload, ExecuteStatus } from './execute';
import { Intent } from './intent';
import { QueryDevice, QueryDevices, QueryInput, QueryPayload } from './query';
import { FulfillPayload, FulfillResponse } from './response';
import { DeviceTypes, SyncDevice, SyncInput, SyncPayload, Trait } from './sync';

export type Input = SyncInput | QueryInput | ExecuteInput | DisconnectInput;

export {
    Intent,
    SyncInput, SyncPayload, SyncDevice,
    QueryInput, QueryPayload, QueryDevices, QueryDevice,
    ExecuteInput, ExecutePayload, ExecuteCommandTypes, ExecuteStatus,
    FulfillPayload, FulfillResponse,
    DeviceTypes, Trait
};
