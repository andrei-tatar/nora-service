import { uniq } from 'lodash';

import { Injectable } from '@andrei-tatar/ts-ioc';
import {
  ExecuteCommandTypes, ExecuteInput, ExecutePayload,
  ExecuteStatus
} from '../../google';
import { CommandExecution, ExecutePayloadCommand } from '../../google/execute';
import { DevicesRepository } from '../../services/devices.repository';

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
        let deviceIds = command.devices.map(d => d.id);

        if (!this.devices.isUserOnline) {
          state.offlineDeviceIds.push(...deviceIds);
          continue;
        }

        deviceIds = this.filterDevices(execution, deviceIds, state);

        switch (execution.command) {
          case ExecuteCommandTypes.Brightness:
          case ExecuteCommandTypes.OnOff:
          case ExecuteCommandTypes.ThermostatTemperatureSetpoint:
          case ExecuteCommandTypes.ThermostatTemperatureSetRange:
          case ExecuteCommandTypes.ThermostatSetMode:
          case ExecuteCommandTypes.getCameraStream:
          case ExecuteCommandTypes.OpenClose:
            this.devices.updateDevicesState(deviceIds, execution.params, updateOptions);
            break;
          case ExecuteCommandTypes.ColorAbsolute:
            if (execution.params.color.spectrumHSV) {
              this.devices.updateDevicesState(deviceIds, {
                color: {
                  spectrumHsv: execution.params.color.spectrumHSV,
                }
              }, updateOptions);
            }
            break;
          case ExecuteCommandTypes.LockUnlock:
            this.devices.updateDevicesState(deviceIds, {
              isLocked: execution.params.lock,
            }, updateOptions);
            break;
          case ExecuteCommandTypes.ActivateScene:
            const deactivate: boolean = typeof execution.params.deactivate === 'boolean' ? execution.params.deactivate : false;
            this.devices.activateScenes(deviceIds, deactivate);
            break;
          case ExecuteCommandTypes.SetVolume:
            this.devices.updateDevicesState(deviceIds, { currentVolume: execution.params.volumeLevel }, updateOptions);
            break;
          case ExecuteCommandTypes.TemperatureRelative:
            this.devices.updateDevicesState(deviceIds, device => {
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
            this.devices.updateDevicesState(deviceIds, device => {
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

        state.successDeviceIds.push(...deviceIds);
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

  private filterDevices(execution: CommandExecution, deviceIds: string[], state: ResponseState) {
    return deviceIds.filter(deviceId => {
      const device = this.devices.getDevice(deviceId);
      if (!device || !device.state.online) {
        state.offlineDeviceIds.push(deviceId);
        return false;
      }

      if ('twoFactor' in device) {
        switch (device.twoFactor) {
          case 'ack':
            if (!execution.challenge || !execution.challenge.ack) {
              state.needAckDeviceIds.push(deviceId);
              return false;
            }
            break;
          case 'pin':
            if (!execution.challenge || !execution.challenge.pin) {
              state.needPinDeviceIds.push(deviceId);
              return false;
            }

            if (execution.challenge.pin !== device.pin) {
              state.wrongPinDeviceIds.push(deviceId);
              return false;
            }
            break;
        }
      }

      return true;
    });
  }
}
