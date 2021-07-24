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

  var topic = `ruuvi/${tagid}/status`;

  getMqttClient().publish(topic , JSON.stringify(data));

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
    var mqtt_host = "localhost";
    var mqtt_port = 1883;
    console.info("MQTT connecting to %s:%d.", mqtt_host, mqtt_port);
    mqtt_client = mqtt.connect({ host: mqtt_host, port: mqtt_port, connectTimeout: 60 * 1000 });
    console.info("MQTT connected.");
  }
  if (!mqtt_client.connected) {
    console.info("MQTT reconnecting.")
    mqtt_client.reconnect();
    console.info("MQTT reconnected.");
  }
  return mqtt_client;
}

console.log("Starting the Ruuvi2MQTT converter.");
listener.start(handleRuuviReading);