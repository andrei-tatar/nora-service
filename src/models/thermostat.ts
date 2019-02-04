import { BaseDevice } from './device';
import { ThermostatHeatCoolState, ThermostatMode, ThermostatSingleState } from './states/thermostat';

export type ThermostatDevice = BaseDevice & {
    type: 'thermostat';
    availableModes: ThermostatMode[];
    temperatureUnit: 'C' | 'F';
    state: ThermostatSingleState | ThermostatHeatCoolState;
};
