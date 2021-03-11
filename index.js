"use strict";

const listener = require('./listener');
const mqtt = require('mqtt');

const entiresToAggregate = 3;

var valuemap = {};

function handleRuuviReading(tagid, data) {
  if (!valuemap[tagid]) {
    valuemap[tagid] = [];
  }

  valuemap[tagid].push(data);

  if (valuemap[tagid].length >= entiresToAggregate) {
    var history = valuemap[tagid];

    var temperature = 0;
    var humidity = 0;
    var pressure = 0;
    var battery = 0;

    history.forEach((data, index) => {
      temperature += data["temperature"];
      humidity += data["humidity"];
      pressure += data["pressure"];
      battery += data["battery"];
    });

    data = {
      "entry_count": history.length,
      "humidity": Math.round(humidity / history.length * 10) / 10,
      "temperature": Math.round(temperature / history.length * 100) / 100,
      "pressure": Math.round(pressure / history.length * 100) / 100,
      "battery": Math.round(battery / history.length)
    };

    valuemap[tagid] = [];

    console.log(`Sending data on topic : "ruuvi/${tagid}/status": `, data);

  }

}

listener.start(handleRuuviReading);

setTimeout(() => {
  process.exit(0);
}, 100 * 1000);