import { State } from './state';

export interface OpenCloseState extends State {
    /**
     * @minimum 0
     * @maximum 100
     */
    openPercent: number;
}
