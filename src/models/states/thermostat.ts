import { State } from './state';

export type ThermostatMode = 'off' | 'heat' | 'cool' | 'on' | 'auto' | 'fan-only' | 'purifier' | 'eco' | 'dry' | 'heatcool';

export interface Thermostat extends State {
    /**
    * @minimum 0
    * @maximum 100
    */
    thermostatHumidityAmbient?: number;
    thermostatTemperatureAmbient: number; // Current observe temperature, in C
    thermostatMode: ThermostatMode;
    thermostatTemperatureSetpoint?: number; // Current temperature set point(single target), in C
    thermostatTemperatureSetpointHigh?: number; // Current high point if in heatcool mode, for a range
    thermostatTemperatureSetpointLow?: number; // Current low point if in heatcool mode, for a range
}
