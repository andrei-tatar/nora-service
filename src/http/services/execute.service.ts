import { isEqual, uniq } from 'lodash';

import { Injectable } from '@andrei-tatar/ts-ioc';
import {
  ExecuteCommandTypes, ExecuteInput, ExecutePayload,
  ExecuteStatus
} from '../../google';
import { CommandExecution, ExecutePayloadCommand } from '../../google/execute';
import { DevicesRepository } from '../../services/devices.repository';
import { compose, decompose } from './util';

interface ResponseState {
  offlineDeviceIds: string[];
  successDeviceIds: string[];
  needAckDeviceIds: string[];
  needPinDeviceIds: string[];
  wrongPinDeviceIds: string[];
}

@Injectable()
export class ExecuteService {

  constructor(
    private devices: DevicesRepository,
  ) {
  }

  execute(input: ExecuteInput, requestId?: string): ExecutePayload {
    const state: ResponseState = {
      offlineDeviceIds: [],
      successDeviceIds: [],
      needAckDeviceIds: [],
      needPinDeviceIds: [],
      wrongPinDeviceIds: [],
    };
    const updateOptions = { requestId, notifyClient: true };
    for (const command of input.payload.commands) {
      for (const execution of command.execution) {
        const googleDeviceIds = command.devices.map(d => d.id);
        if (!this.devices.isUserOnline) {
          state.offlineDeviceIds.push(...googleDeviceIds);
          continue;
        }

        const deviceIdsByGroup: { [group: string]: string[] } = {};
        for (const googleId of googleDeviceIds) {
          const { id, group } = decompose(googleId);
          let ids = deviceIdsByGroup[group];
          if (!ids) { deviceIdsByGroup[group] = ids = []; }
          ids.push(id);
        }

        for (let [group, deviceIds] of Object.entries(deviceIdsByGroup)) {
          deviceIds = this.filterDevices(execution, group, deviceIds, state);

          switch (execution.command) {
            case ExecuteCommandTypes.Brightness:
              this.devices.updateDevicesState(group, deviceIds, device => {
                if (device.type === 'light') {
                  if (device.brightnessControl &&
                    device.turnOnWhenBrightnessChanges &&
                    device.state.brightness !== execution.params.brightness) {
                    return {
                      on: true,
                      brightness: execution.params.brightness,
                    };
                  }
                }
                return execution.params;
              }, updateOptions);
              break;
            case ExecuteCommandTypes.OnOff:
            case ExecuteCommandTypes.ThermostatTemperatureSetpoint:
            case ExecuteCommandTypes.ThermostatTemperatureSetRange:
            case ExecuteCommandTypes.ThermostatSetMode:
            case ExecuteCommandTypes.OpenClose:
              this.devices.updateDevicesState(group, deviceIds, execution.params, updateOptions);
              break;
            case ExecuteCommandTypes.ColorAbsolute:
              if (execution.params.color.spectrumHSV) {
                this.devices.updateDevicesState(group, deviceIds, device => {
                  const update = {
                    color: {
                      spectrumHsv: execution.params.color.spectrumHSV,
                    },
                  };
                  if (device.type === 'light') {
                    if (device.brightnessControl &&
                      device.colorControl &&
                      device.turnOnWhenBrightnessChanges &&
                      !isEqual(device.state.color, update.color)) {
                      return {
                        on: true,
                        ...update,
                      };
                    }
                  }
                  return update;
                }, updateOptions);
              }
              break;
            case ExecuteCommandTypes.LockUnlock:
              this.devices.updateDevicesState(group, deviceIds, {
                isLocked: execution.params.lock,
              }, updateOptions);
              break;
            case ExecuteCommandTypes.ActivateScene:
              const deactivate: boolean = typeof execution.params.deactivate === 'boolean' ? execution.params.deactivate : false;
              this.devices.activateScenes(group, deviceIds, deactivate);
              break;
            case ExecuteCommandTypes.SetVolume:
              this.devices.updateDevicesState(group, deviceIds, { currentVolume: execution.params.volumeLevel }, updateOptions);
              break;
            case ExecuteCommandTypes.TemperatureRelative:
              this.devices.updateDevicesState(group, deviceIds, device => {
                if (device.type === 'thermostat') {
                  const { thermostatTemperatureRelativeDegree, thermostatTemperatureRelativeWeight } = execution.params;
                  const change = thermostatTemperatureRelativeDegree || (thermostatTemperatureRelativeWeight / 2);
                  return {
                    thermostatTemperatureSetpoint: device.state + change,
                  };
                }
                return {};
              }, updateOptions);
              break;
            case ExecuteCommandTypes.VolumeRelative:
              this.devices.updateDevicesState(group, deviceIds, device => {
                if (device.type === 'speaker' && 'currentVolume' in device.state) {
                  const relativeStepSize = device.relativeVolumeStep || execution.params.volumeRelativeLevel;
                  const delta = execution.params.relativeSteps * relativeStepSize;
                  const newVolume = Math.min(100, Math.max(0, device.state.currentVolume + delta));
                  return { currentVolume: newVolume };
                }
                return {};
              }, updateOptions);
              break;
            default:
              console.warn(`unsupported execution command: ${execution.command}`);
              break;
          }

          state.successDeviceIds.push(...deviceIds.map(id => compose({ id, group })));
        }

        break;
      }
    }

    const payload: ExecutePayload = { commands: [] };
    this.addResponseCommand(payload, state.successDeviceIds, ExecuteStatus.success);
    this.addResponseCommand(payload, state.offlineDeviceIds, ExecuteStatus.offline);
    this.addResponseCommand(payload, state.needAckDeviceIds, ExecuteStatus.error, c => {
      c.errorCode = 'challengeNeeded';
      c.challengeNeeded = { type: 'ackNeeded' };
    });
    this.addResponseCommand(payload, state.needPinDeviceIds, ExecuteStatus.error, c => {
      c.errorCode = 'challengeNeeded';
      c.challengeNeeded = { type: 'pinNeeded' };
    });
    this.addResponseCommand(payload, state.wrongPinDeviceIds, ExecuteStatus.error, c => {
      c.errorCode = 'challengeNeeded';
      c.challengeNeeded = { type: 'challengeFailedPinNeeded' };
    });

    return payload;
  }

  private addResponseCommand(
    payload: ExecutePayload, ids: string[], status: ExecuteStatus,
    customize?: (command: ExecutePayloadCommand) => void
  ) {
    if (ids.length) {
      const command: ExecutePayloadCommand = {
        ids: uniq(ids),
        status,
      };
      if (customize) { customize(command); }
      payload.commands.push(command);
    }
  }

  private filterDevices(execution: CommandExecution, group: string, deviceIds: string[], state: ResponseState) {
    return deviceIds.filter(deviceId => {
      const device = this.devices.userDevices[group]?.devices?.[deviceId];
      const googleId = compose({ id: deviceId, group });
      if (device?.state?.online !== true) {
        state.offlineDeviceIds.push(googleId);
        return false;
      }

      if ('twoFactor' in device) {
        switch (device.twoFactor) {
          case 'ack':
            if (!execution.challenge || !execution.challenge.ack) {
              state.needAckDeviceIds.push(googleId);
              return false;
            }
            break;
          case 'pin':
            if (!execution.challenge || !execution.challenge.pin) {
              state.needPinDeviceIds.push(googleId);
              return false;
            }

            if (execution.challenge.pin !== device.pin) {
              state.wrongPinDeviceIds.push(googleId);
              return false;
            }
            break;
        }
      }

      return true;
    });
  }
}
