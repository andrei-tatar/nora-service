import { State } from './state';

export interface ColorState extends State {
    color: {
        spectrumHsv: {
            /**
             * @minimum 0
             * @maximum 360
             */
            hue: number;
            /**
             * @minimum 0
             * @maximum 1
             */
            saturation: number;
            /**
             * @minimum 0
             * @maximum 1
             */
            value: number;
        };
    };
}
