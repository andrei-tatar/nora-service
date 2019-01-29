import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { Socket } from 'socket.io';

import { Destroyable, Inject } from '../ioc';
import { DevicesRepository } from '../services/devices.repository';
import { ValidationService } from '../services/validation.service';
import { BindEvent } from './decorators/bindevent';
import { SyncDevices, UpdateDevices } from './types';

export class ConnectionHandler implements Destroyable {
    private destroy$ = new Subject();
    private devicesSynced$ = new BehaviorSubject(false);

    constructor(
        @Inject('socket')
        socket: Socket,
        private userDevices: DevicesRepository,
        @Inject('group')
        private group: string,
        private validation: ValidationService,
    ) {
        userDevices.stateChanges$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(changes => {
            const update: UpdateDevices = { ...changes };
            const groupDevices = this.userDevices.getDeviceIdsInGroup(this.group);
            for (const deviceId of Object.keys(update)) {
                if (groupDevices.indexOf(deviceId) < 0) {
                    delete update[deviceId];
                }
            }

            if (Object.keys(update).length) {
                socket.emit('update', update);
            }
        });

        userDevices.commands$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(command => {
            switch (command.type) {
                case 'activate-scene':
                    const groupDevices = this.userDevices.getDeviceIdsInGroup(this.group);
                    const deviceIds = command.deviceIds.filter(id => groupDevices.indexOf(id) >= 0);
                    if (deviceIds.length) {
                        socket.emit(`activate-scene`, deviceIds, command.deactivate);
                    }
                    break;
            }
        });

        const version = socket.handshake.query.version;
        this.devicesSynced$.pipe(
            distinctUntilChanged(),
            switchMap(devSynced => devSynced
                ? this.userDevices.userOnline(this.group, version)
                : EMPTY),
            takeUntil(this.destroy$)
        ).subscribe();
    }

    @BindEvent('sync')
    async sync(devices: SyncDevices) {
        try {
            this.validation.validate('sync', devices);
            this.devicesSynced$.next(true);
            await this.userDevices.sync(devices, this.group);
        } catch (err) {
            this.devicesSynced$.next(false);
            throw err;
        }
    }

    @BindEvent('update')
    update(update: UpdateDevices) {
        if (!this.devicesSynced$.value) { return; }
        this.validation.validate('update', update);
        const ids = Object.keys(update);
        for (const id of ids) {
            this.userDevices.updateDevicesState([id], update[id], {
                group: this.group,
            });
        }
    }

    destroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
