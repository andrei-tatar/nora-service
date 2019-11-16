import { cloneDeep, isEqual, Omit } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Inject } from '@andrei-tatar/ts-ioc';
import { AllStates, Device, Devices, StateChanges } from '../models';
import { ReportStateService } from './report-state.service';
import { RequestSyncService } from './request-sync.service';

export class DevicesRepository {
    private static commands = new Subject<Command>();
    private static statechanges = new Subject<{
        uid: string;
        stateChanges: StateChanges;
        hasChanges: boolean;
    }>();
    private static onlineUsers: {
        [uid: string]: {
            [group: string]: string;
        };
    } = {};
    private static devicesPerUser: {
        [uid: string]: {
            [group: string]: Devices;
        };
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

    readonly stateChanges$ = DevicesRepository.statechanges.pipe(filter(c => c.uid === this.uid));
    readonly commands$ = DevicesRepository.commands.pipe(filter(c => c.uid === this.uid), map(c => c as Omit<Command, 'uid'>));

    constructor(
        @Inject('uid')
        private uid: string,
        private reportStateService: ReportStateService,
        private requestSyncService: RequestSyncService,
    ) {
    }

    async sync(devices: Devices, group: string) {
        const oldDevices = this.getDevicesInternal(group);

        const existingDevices = this.getSyncCompareDevices(oldDevices);
        const newDevices = this.getSyncCompareDevices(devices);

        let userGroups = DevicesRepository.devicesPerUser[this.uid];
        if (!userGroups) {
            DevicesRepository.devicesPerUser[this.uid] = userGroups = {};
        }

        userGroups[group] = cloneDeep(devices);
        if (!isEqual(existingDevices, newDevices)) {
            try {
                await this.requestSyncService.requestSync();
            } catch (err) {
                console.warn(`requestSync failed, trying again in 10 sec`, err);
                await new Promise(r => setTimeout(r, 10000));
                this.requestSyncService.requestSync().catch(err => {
                    console.warn(`requestSync try 2 failed`, err);
                });
            }
        }
    }

    getAllDevices() {
        return this.getDevicesInternal();
    }

    getDevicesById(ids: string[]) {
        const userDevices = this.getAllDevices();
        return ids.map(id => userDevices[id]);
    }

    getDevice(id: string) {
        return this.getAllDevices()[id];
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
                const deviceIds = Object.keys(this.getDevicesInternal(group));
                this.updateDevicesState(deviceIds, { online: false }, { group });
            };
        });
    }

    activateScenes(deviceIds: string[], deactivate: boolean) {
        DevicesRepository.commands.next({ type: 'activate-scene', uid: this.uid, deviceIds, deactivate });
    }

    updateDevicesState(
        ids: string[],
        changes: Partial<AllStates> | ((device: Device) => Partial<AllStates>),
        { notifyClient = false, requestId, group }: { notifyClient?: boolean, requestId?: string, group?: string } = {}
    ) {
        const groupDevices = this.getDevicesInternal(group);
        const stateChanges: StateChanges = {};
        const notiyClientChanges: StateChanges = {};
        let anyChange = false;
        for (const id of ids) {
            const device = groupDevices[id];
            if (!device) { continue; }

            let hasChanged = false;
            const deviceChanges = typeof changes === 'function' ? changes(device) : changes;
            for (const key of Object.keys(deviceChanges)) {
                const oldValue = device.state[key];
                const newValue = deviceChanges[key];
                device.state[key] = newValue;
                hasChanged = !isEqual(oldValue, newValue);
            }

            if (hasChanged) {
                stateChanges[id] = device.state;
                anyChange = true;
            }

            notiyClientChanges[id] = device.state;
        }

        if (anyChange) {
            this.reportStateService.reportState(stateChanges, requestId).catch(err => {
                console.warn('err while reporting state', err);
            });
        }

        if (notifyClient) {
            DevicesRepository.statechanges.next({
                uid: this.uid,
                stateChanges: notiyClientChanges,
                hasChanges: anyChange,
            });
        }
    }

    getDeviceIdsInGroup(group: string) {
        const userDevices = DevicesRepository.devicesPerUser[this.uid] || {};
        const groupDevices = userDevices[group] || [];
        return Object.keys(groupDevices);
    }

    private getDevicesInternal(group?: string) {
        const userDevices = DevicesRepository.devicesPerUser[this.uid] || {};
        if (group) {
            return userDevices[group] || {};
        } else {
            const allDevices: Devices = {};
            for (const groupName of Object.keys(userDevices)) {
                const groupDevices = userDevices[groupName];
                for (const deviceId of Object.keys(groupDevices)) {
                    allDevices[deviceId] = groupDevices[deviceId];
                }
            }
            return allDevices;
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
    deviceIds: string[];
    deactivate: boolean;
}
