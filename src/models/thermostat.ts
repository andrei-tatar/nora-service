import { BaseDevice, State } from './device';

export interface BaseThermostatMode extends State {
    /**
    * @minimum 0
    * @maximum 100
    */
    thermostatHumidityAmbient?: number;
    thermostatTemperatureAmbient: number; // Current observe temperature, in C
}

export interface ThermostatSingleState extends BaseThermostatMode {
    thermostatMode: ThermostatModeSingle;
    thermostatTemperatureSetpoint: number; // Current temperature set point(single target), in C
}

export interface ThermostatHeatCoolState extends BaseThermostatMode {
    thermostatMode: ThermostatModeHeatCool;
    thermostatTemperatureSetpointHigh: number; // Current high point if in heatcool mode, for a range
    thermostatTemperatureSetpointLow: number; // Current low point if in heatcool mode, for a range
}

export type ThermostatDevice = BaseDevice & {
    type: 'thermostat';
    availableModes: ThermostatMode[];
    temperatureUnit: 'C' | 'F';
    state: ThermostatSingleState; // | ThermostatHeatCoolState;
};

export type ThermostatMode = ThermostatModeSingle | ThermostatModeHeatCool;
export type ThermostatModeSingle = 'off' | 'heat' | 'cool' | 'on' | 'auto' | 'fan-only' | 'purifier' | 'eco' | 'dry';
export type ThermostatModeHeatCool = 'heatcool';
