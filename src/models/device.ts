export type BaseDevice = Device | DeviceWithAck | DeviceWithPin;

interface Device {
    name: string;
    roomHint?: string;
    nicknames?: string[];
}

interface DeviceWithAck extends Device {
    twoFactor: 'ack';
}

interface DeviceWithPin extends Device {
    twoFactor: 'pin';
    pin: string;
}

export interface State {
    online: boolean;
}
