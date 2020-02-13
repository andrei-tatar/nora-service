import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { Socket } from 'socket.io';

import { Destroyable, Inject } from '@andrei-tatar/ts-ioc';
import { DevicesRepository } from '../services/devices.repository';
import { ValidationService } from '../services/validation.service';
import { BindEvent } from './decorators/bindevent';
import { SyncDevices, UpdateDevices } from './types';

export class ConnectionHandler implements Destroyable {
    private destroy$ = new Subject();
    private devicesSynced$ = new BehaviorSubject(false);

    constructor(
        @Inject('socket') socket: Socket,
        @Inject('notify') notify: boolean,
        @Inject('group') private group: string,
        @Inject('local') private localExecution: boolean,
        private userDevices: DevicesRepository,
        private validation: ValidationService,
    ) {
        userDevices.stateChanges$.pipe(
            filter(c => c.group === this.group && (c.hasChanges || notify)),
            map(c => c.stateChanges),
            takeUntil(this.destroy$)
        ).subscribe(changes => {
            socket.emit('update', changes);
        });

        userDevices.commands$.pipe(
            filter(c => c.group === this.group),
            takeUntil(this.destroy$)
        ).subscribe(command => {
            switch (command.type) {
                case 'activate-scene':
                    socket.emit(`activate-scene`, command.deviceIds, command.deactivate);
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
            await this.userDevices.sync(devices, this.group, this.localExecution);
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
            this.userDevices.updateDevicesState(this.group, [id], update[id]);
        }
    }

    destroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
