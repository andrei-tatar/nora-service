import { AllStates } from '../models';
import { Intent } from './intent';
import { FulfillPayload } from './response';

export interface QueryInput {
    intent: Intent.Query;
    payload: {
        devices: Array<{
            id: string;
            customData?: any;
        }>;
    };
}

export interface QueryPayload extends FulfillPayload {
    devices: QueryDevices;
}

export interface QueryDevices {
    [id: string]: QueryDevice;
}

export type QueryDevice = {
    errorCode?: string;
    debugString?: string;
    [param: string]: any;
} & Partial<AllStates>;
