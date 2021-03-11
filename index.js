"use strict";

const listener = require('./listener');
const mqtt = require('mqtt');

var mqtt_client;

const entiresToAggregate = 25;

var valuemap = {};

function handleRuuviReading(tagid, data) {
  if (!valuemap[tagid]) {
    valuemap[tagid] = [];
  }

  valuemap[tagid].push(data);

  if (valuemap[tagid].length >= entiresToAggregate) {
    sendDataForTag(tagid);
  }

}

function sendDataForTag(tagid) {
  var history = valuemap[tagid];

  var data = getAveragedDataForTag(tagid);

  valuemap[tagid] = [];

  console.log(`Sending data on topic : "ruuvi/${tagid}/status": `, data);

  getMqttClient().publish(`ruuvi/${tagid}/status`, JSON.stringify(data));

}

function getAveragedDataForTag(tagid) {
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

  return {
    "entry_count": history.length,
    "humidity": Math.round(humidity / history.length * 10) / 10,
    "temperature": Math.round(temperature / history.length * 100) / 100,
    "pressure": Math.round(pressure / history.length * 100) / 100,
    "battery": Math.round(battery / history.length)
  };
}

function getMqttClient() {
  if (!mqtt_client) {
    mqtt_client = mqtt.connect({ host: "localhost", port: 1883, connectTimeout: 60 * 1000 });
  }
  if (!mqtt_client.connected) {
    mqtt_client.reconnect();
  }
  return mqtt_client;
}

listener.start(handleRuuviReading);

setTimeout(() => {
  process.exit(0);
}, 100 * 1000);