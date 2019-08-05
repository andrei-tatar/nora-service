import { BaseDevice } from './device';
import { Thermostat, ThermostatMode } from './states/thermostat';

interface BaseThermostat {
    type: 'thermostat';
    availableModes: ThermostatMode[];
    temperatureUnit: 'C' | 'F';
    bufferRangeCelsius?: number;
    commandOnlyTemperatureSetting?: false;
    queryOnlyTemperatureSetting?: false;
}

interface DefaultStateThermostat {
    state: Thermostat;
}

interface CommandOnlyThermostat {
    state: Thermostat;
    commandOnlyTemperatureSetting: true;
}

interface QueryOnlyThermostat {
    state: Partial<Thermostat>;
    queryOnlyTemperatureSetting: true;
}

export type ThermostatDevice = BaseDevice & BaseThermostat & (DefaultStateThermostat | CommandOnlyThermostat | QueryOnlyThermostat);
