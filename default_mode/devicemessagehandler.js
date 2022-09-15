"use strict";

const { logger, settings } = require("../globals");

const deviceSettings = require("../devicesettings");

const mqtt = require("../mqtt");

var valuemap = {};
var nextSendForMac = {};

function handleRuuviReading(mac, data) {
  if (!valuemap[mac]) {
    reinitData(mac, true);
  }

  valuemap[mac].push(data);

  if (enoughtData(mac) || dataIsOverdue(mac)) {
    sendDataForTag(mac);
  }
}

function reinitData(mac, isFirstInit) {
  valuemap[mac] = [];
  if (isFirstInit) {
    //allow for only 15 second aggregation for the first sample from a tag
    nextSendForMac[mac] = new Date(new Date().getTime() + 15 * 1000);
  } else {
    //allow for normal amount of seconds of aggregation
    nextSendForMac[mac] = new Date(
      new Date().getTime() + settings.maxWaitSeconds * 1000
    );
  }
}

function enoughtData(mac) {
  return valuemap[mac].length >= settings.maxEntriesToAggregate;
}

function dataIsOverdue(mac) {
  if (valuemap[mac].length == 0) return false;

  logger.debug(`Data for mac ${mac} is overdue.`);
  return new Date() > nextSendForMac[mac];
}

function checkAndSendOveragedData() {
  for (const [mac, value] of Object.entries(valuemap)) {
    if (enoughtData(mac) || dataIsOverdue(mac)) {
      logger.debug(`Data for mac ${mac} is sent.`);
      sendDataForTag(mac);
    }
  }
}

function sendDataForTag(mac) {
  var data = getAveragedDataForTag(mac);
  var topic = deviceSettings.getTopicForMac(mac);
  mqtt.publish(topic, JSON.stringify(data));

  var tasmotaTemperatureTopics =
    deviceSettings.getTasmotaTemperatureTopicsByMac(mac);
  if (tasmotaTemperatureTopics)
    tasmotaTemperatureTopics.forEach((tasmotaTemperatureTopic) => {
      mqtt.publish(tasmotaTemperatureTopic, `${data.temperature}`);
    });

  reinitData(mac);
}

function getAveragedDataForTag(mac) {
  var history = valuemap[mac];

  var temperature = 0;
  var humidity = 0;
  var pressure = 0;
  var battery = 0;
  var rssi = 0;

  history.forEach((data, index) => {
    temperature += data["temperature"];
    humidity += data["humidity"];
    pressure += data["pressure"];
    battery += data["battery"];
    rssi += data["rssi"];
  });

  return {
    entry_count: history.length,
    humidity: Math.round((humidity / history.length) * 10) / 10,
    temperature: Math.round((temperature / history.length) * 100) / 100,
    pressure: Math.round(pressure / history.length) / 100,
    battery: Math.round(
      ((battery / history.length / 1000 - 1.8) / (3.6 - 1.8)) * 100
    ),
    rssi: Math.round(rssi / history.length),
    mac: mac,
  };
}

module.exports = {
  handleRuuviReading: handleRuuviReading,
  checkAndSendOveragedData: checkAndSendOveragedData,
};
