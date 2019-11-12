import { State } from './state';

export interface LockUnlockState extends State {
    isLocked: boolean;
}
