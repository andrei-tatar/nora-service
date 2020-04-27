import { cloneDeep, isEqual, Omit } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Inject } from '@andrei-tatar/ts-ioc';
import { compose } from '../http/services/util';
import { AllStates, Device, Devices, StateChanges } from '../nora-common/models';
import { delay } from '../util';
import { ReportStateService } from './report-state.service';
import { RequestSyncService } from './request-sync.service';

export class DevicesRepository {
    private static commands = new Subject<Command>();
    private static statechanges = new Subject<{
        uid: string;
        group: string;
        stateChanges: StateChanges;
        hasChanges: boolean;
    }>();
    private static onlineUsers: {
        [uid: string]: {
            [group: string]: string;
        };
    } = {};
    private static devicesPerUser: {
        [uid: string]: UserDevices;
    } = {};

    get isUserOnline() {
        return !!DevicesRepository.onlineUsers[this.uid];
    }

    get onlineUsers() {
        return DevicesRepository.onlineUsers;
    }

    get allDevices() {
        return DevicesRepository.devicesPerUser;
    }

    get userDevices() {
        return DevicesRepository.devicesPerUser[this.uid] ?? {};
    }

    readonly stateChanges$ = DevicesRepository.statechanges.pipe(filter(c => c.uid === this.uid));
    readonly commands$ = DevicesRepository.commands.pipe(filter(c => c.uid === this.uid), map(c => c as Omit<Command, 'uid'>));

    constructor(
        @Inject('uid')
        private uid: string,
        private reportStateService: ReportStateService,
        private requestSyncService: RequestSyncService,
    ) {
    }

    async sync(newDevices: Devices, group: string, localExecution: boolean) {
        const oldDevices = DevicesRepository.devicesPerUser[this.uid]?.[group]?.devices ?? {};

        const oldSync = this.getSyncCompareDevices(oldDevices);
        const newSync = this.getSyncCompareDevices(newDevices);

        let userGroups = DevicesRepository.devicesPerUser[this.uid];
        if (!userGroups) {
            DevicesRepository.devicesPerUser[this.uid] = userGroups = {};
        }

        userGroups[group] = {
            devices: cloneDeep(newDevices),
            localExecution,
        };

        if (!isEqual(oldSync, newSync)) {
            try {
                await this.requestSyncService.requestSync();
            } catch (err) {
                console.warn(`requestSync failed, trying again in 10 sec`, err);
                await delay(10000);
                this.requestSyncService.requestSync().catch(err => {
                    console.warn(`requestSync try 2 failed`, err);
                });
            }
        }
    }

    userOnline(group: string, version: string = 'unknown') {
        return new Observable<void>(() => {
            let onlineGroups = DevicesRepository.onlineUsers[this.uid];
            if (!onlineGroups) {
                DevicesRepository.onlineUsers[this.uid] = onlineGroups = {};
            }
            onlineGroups[group] = version;

            return () => {
                delete onlineGroups[group];
                if (Object.keys(onlineGroups).length === 0) {
                    delete DevicesRepository.onlineUsers[this.uid];
                }
                const deviceIds = Object.keys(this.userDevices[group]?.devices ?? {});
                this.updateDevicesState(group, deviceIds, { online: false });
            };
        });
    }

    activateScenes(group: string, deviceIds: string[], deactivate: boolean) {
        DevicesRepository.commands.next({ type: 'activate-scene', uid: this.uid, deviceIds, group, deactivate });
    }

    updateDevicesState(
        group: string,
        ids: string[],
        changes: Partial<AllStates> | ((device: Device) => Partial<AllStates>),
        { notifyClient = false, requestId }: { notifyClient?: boolean, requestId?: string } = {}
    ) {
        const groupDevices = DevicesRepository.devicesPerUser[this.uid]?.[group]?.devices ?? {};
        const googleStateChanges: StateChanges = {};
        const notiyClientChanges: StateChanges = {};
        let anyChange = false;
        for (const id of ids) {
            const device = groupDevices[id];
            if (!device) { continue; }

            const deviceChanges = typeof changes === 'function' ? changes(device) : changes;
            for (const key of Object.keys(deviceChanges)) {
                const newValue = deviceChanges[key];
                device.state[key] = newValue;
            }
            anyChange = true;
            googleStateChanges[compose({ id, group })] = device.state;
            notiyClientChanges[id] = device.state;
        }

        if (anyChange) {
            this.reportStateService.reportState(googleStateChanges, requestId).catch(err => {
                console.warn('err while reporting state', err);
            });
        }

        if (notifyClient) {
            DevicesRepository.statechanges.next({
                uid: this.uid,
                group,
                stateChanges: notiyClientChanges,
                hasChanges: anyChange,
            });
        }
    }

    private getSyncCompareDevices(devices: Devices) {
        const forCompare: Devices = {};
        for (const id of Object.keys(devices)) {
            forCompare[id] = { ...devices[id], state: null };
        }
        return forCompare;
    }
}

export type Command = ActivateSceneCommand;

export interface ActivateSceneCommand {
    type: 'activate-scene';
    uid: string;
    group: string;
    deviceIds: string[];
    deactivate: boolean;
}

export interface UserDevices {
    [group: string]: {
        devices: Devices;
        localExecution: boolean;
    };
}
