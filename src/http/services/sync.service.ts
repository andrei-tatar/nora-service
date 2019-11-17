import { uniq } from 'lodash';

import { Inject } from '@andrei-tatar/ts-ioc';
import { DeviceTypes, SyncDevice, SyncPayload, Traits } from '../../google';
import { Devices, StateChanges } from '../../models';
import { DevicesRepository } from '../../services/devices.repository';
import { ReportStateService } from '../../services/report-state.service';
import { delay } from '../../util';

export class SyncService {

    constructor(
        @Inject('uid')
        private uid: string,
        private devices: DevicesRepository,
        private reportStateService: ReportStateService,
    ) {
    }

    sync(requestId: string): SyncPayload {
        const devices = this.devices.getAllDevices();
        this.reportState(requestId, devices);
        const syncDevices = this.devicesToSync(devices);
        return {
            agentUserId: this.uid,
            devices: syncDevices,
        };
    }

    private devicesToSync(devices: Devices) {
        const syncDevices: SyncDevice[] = [];
        for (const id of Object.keys(devices)) {
            const device = devices[id];
            const sync: SyncDevice = {
                id,
                type: null,
                traits: [],
                name: {
                    name: device.name,
                    nicknames: device.nicknames,
                },
                roomHint: device.roomHint,
                willReportState: true,
            };
            switch (device.type) {
                case 'switch':
                    sync.type = DeviceTypes.Switch;
                    sync.traits.push(Traits.OnOff);
                    break;
                case 'outlet':
                    sync.type = DeviceTypes.Outlet;
                    sync.traits.push(Traits.OnOff);
                    break;
                case 'light':
                    sync.type = DeviceTypes.Light;
                    sync.traits.push(Traits.OnOff);
                    if (device.brightnessControl) {
                        sync.traits.push(Traits.Brightness);
                    }
                    if (device.colorControl) {
                        sync.traits.push(Traits.ColorSetting);
                        sync.attributes = { colorModel: 'hsv' };
                    }
                    break;
                case 'scene':
                    sync.type = DeviceTypes.Scene;
                    sync.traits.push(Traits.Scene);
                    sync.willReportState = false;
                    sync.attributes = {
                        sceneReversible: device.sceneReversible,
                    };
                    break;
                case 'thermostat':
                    sync.type = DeviceTypes.Thermostat;
                    sync.traits.push(Traits.TemperatureSetting);
                    sync.attributes = {
                        availableThermostatModes: uniq(device.availableModes).join(','),
                        thermostatTemperatureUnit: device.temperatureUnit,
                        bufferRangeCelsius: device.bufferRangeCelsius,
                        commandOnlyTemperatureSetting: device.commandOnlyTemperatureSetting,
                        queryOnlyTemperatureSetting: device.queryOnlyTemperatureSetting,
                    };
                    break;
                case 'speaker':
                    sync.type = DeviceTypes.Speaker;
                    sync.traits.push(Traits.OnOff, Traits.Volume);
                    break;
                case 'blinds':
                    sync.type = DeviceTypes.Blinds;
                    sync.traits.push(Traits.OpenClose);
                    break;
                case 'garage':
                    sync.type = DeviceTypes.Garage;
                    sync.traits.push(Traits.OpenClose);
                    break;
                case 'lock':
                    sync.type = DeviceTypes.Lock;
                    sync.traits.push(Traits.LockUnlock);
                    break;
            }
            syncDevices.push(sync);
        }
        return syncDevices;
    }

    private async reportState(requestId: string, devices: Devices) {
        const stateChanges: StateChanges = {};
        const ids = Object.keys(devices);
        for (const id of ids) {
            stateChanges[id] = devices[id].state;
        }
        if (ids.length) {
            try {
                await delay(3000);
                await this.reportStateService.reportState(stateChanges, requestId);
            } catch (err) {
                console.warn(`reportState failed (uid: ${this.uid})`, err);
            }
        }
    }
}
