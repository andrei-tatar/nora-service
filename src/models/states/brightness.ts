import { State } from './state';

export interface BrightnessState extends State {
    /**
     * @minimum 0
     * @maximum 100
     */
    brightness: number;
}
