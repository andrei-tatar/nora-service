import { ExecuteCommandTypes } from '../nora-common/google/execute';
import { Intent } from './intent';
import { FulfillPayload } from './response';

export interface ExecuteInput {
    intent: Intent.Execute;
    payload: {
        commands: ExecuteCommand[];
    };
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
