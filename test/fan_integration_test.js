#!/usr/bin/node
const TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJVazVIZVBjUGtEUzVZUmtNZHdsTlRjeW1LNzMzIiwic2NvcGUiOiJub2RlLXJlZCIsInZlcnNpb24iOjEsImlhdCI6MTU5NDk3NjA4NX0.0-PUuGO9PnE1bzaWmQU8mL2jwZo4loW9fvrswaUZtGI"
const URI = 'https://noradevtest.herokuapp.com/?version='+'0.0.30'+'&token=' + encodeURIComponent(TOKEN) + "&notify=" + true;
const util = require('util');

function inspect(object) {
    console.log(util.inspect(object, {showHidden: false, depth: null}))
}

var fan_speeds = {
    'speeds': [
    {
        'speed_name': 'S1',
        'speed_values': [{
            'speed_synonym': ['low', 'speed 1'],
            'lang': 'en'
        }]
    },
    {
        'speed_name': 'S2',
        'speed_values': [{
            'speed_synonym': ['medium', 'speed 2'],
            'lang': 'en'
        }]
    },
    {
        'speed_name': 'S3',
        'speed_values': [{
            'speed_synonym': ['high', 'speed 3'],
            'lang': 'en'
        }]
    },
    {
        'speed_name': 'S4',
        'speed_values': [{
            'speed_synonym': ['max', 'speed 4'],
            'lang': 'en'
        }]
    }
    ],
    'ordered': true
}

var devices = {
    'Primary Fan' : {
        'type': 'fan',
        'name': 'Primary Fan',
        'roomHint': 'living room',
        'reversible': false,
        'supportsFanSpeedPercent': false,
        'commandOnlyFanSpeed': false,
        'availableFanSpeeds': fan_speeds,
        'state': {
            'on': true,
            'currentFanSpeedSetting': 'S1',
            'online': true,
        }
    },
    'Secondary Fan' : {
        'type': 'fan',
        'name': 'Secondary Fan',
        'roomHint': 'living room',
        'reversible': false,
        'supportsFanSpeedPercent': true,
        'commandOnlyFanSpeed': false,
        'availableFanSpeeds': fan_speeds,
        'state': {
            'on': true,
            'currentFanSpeedSetting': 'S1',
            'online': true,
            'currentFanSpeedPercent': 10
        }
    }
}
            

var socket_io_client = require('socket.io-client')(URI);
//From Nora API
socket_io_client.on('connect', function(){
        console.log("Connected")
        inspect(devices);
        socket_io_client.emit('sync', devices, 'req:sync');
        socket_io_client.emit('resync', devices, 'req:resync');
});
//From Nora API
socket_io_client.on('update', function (msg){
    console.log("got an update")
    last_nora_update = new Date();
    inspect(msg);
    Object.keys(msg).forEach(function (device) {
        var update = {};
        update[device] = msg[device];
        Object.keys(msg[device]).forEach(function (trait) {
            inspect(trait);
            inspect(msg[device][trait]);
            if (devices[device]['state'].hasOwnProperty(trait)) {
                console.log(`device has trait ${trait}`);
                devices[device]['state'][trait]=msg[device][trait];
            } else {
                if (trait === 'fanSpeedPercent') {
                    devices[device]['state']['currentFanSpeedPercent'] = msg[device][trait];
                    if (msg[device].hasOwnProperty('currentFanSpeedPercent')) {
                        msg[device]['currentFanSpeedPercent'] = msg[device][trait];
                    }
                } else if (trait === 'fanSpeed') {
                    devices[device]['state']['currentFanSpeedSetting'] = msg[device][trait];
                    if (msg[device].hasOwnProperty('currentFanSpeedSetting')) {
                        msg[device]['currentFanSpeedSetting'] = msg[device][trait];
                    }
                }
            }
        });
        inspect(devices[device]['state']);
        socket_io_client.emit('update', {'device': devices[device]['state']}, "req:" + device );
    });
});
socket_io_client.on('action-error', function (reqId, msg) {
    if (reqId === 'req:sync') {
        console.log("nora: sync error (" + msg + ")");
    }
    console.log('action-error message: ');
    inspect(reqId);
    inspect(msg);
});
socket_io_client.on('activate-scene', function (ids, deactivate) { 
    console.log('activate-scene message: ')
    console.inspect(ids);
    console.inspect(deactivate);
});
socket_io_client.on('error', function(err) {
    console.log("Detected error:");
    inspect(err);
});
//From Nora API
socket_io_client.on('disconnect', function(reason){
    console.log("Disconnected from nora because of " + reason)
});

socket_io_client.connect()
