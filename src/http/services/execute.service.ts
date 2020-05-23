import { uniq } from 'lodash';

import { Injectable } from '@andrei-tatar/ts-ioc';
import { ExecuteInput, ExecutePayload, ExecuteStatus } from '../../google';
import { CommandExecution, ExecutePayloadCommand } from '../../google/execute';
import { ExecuteCommandTypes, getStateChanges } from '../../nora-common/google/execute';
import { compose, decompose } from '../../nora-common/util';
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
            case ExecuteCommandTypes.ActivateScene:
              const deactivate: boolean = typeof execution.params.deactivate === 'boolean' ? execution.params.deactivate : false;
              this.devices.activateScenes(group, deviceIds, deactivate);
              break;

            default:
              this.devices.updateDevicesState(group, deviceIds,
                device => getStateChanges(execution.command, execution.params, device), updateOptions);
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
