import { BaseDevice, State } from './device';

export interface SwitchState extends State {
    on: boolean;
}

export type SwitchDevice = BaseDevice & {
    type: 'switch';
    state: SwitchState;
};
