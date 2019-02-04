import { BaseDevice } from './device';
import { Thermostat, ThermostatMode } from './states/thermostat';

export type ThermostatDevice = BaseDevice & {
    type: 'thermostat';
    availableModes: ThermostatMode[];
    temperatureUnit: 'C' | 'F';
    state: Thermostat;
};
