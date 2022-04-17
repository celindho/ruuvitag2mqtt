"use strict";

const { logger, settings } = require("./globals");

const deviceSettings = require("./devicesettings");

var listener;
if (settings.useDummyData == "true") {
  listener = require("./dummy_listener");
} else {
  listener = require("./listener");
}

const mqtt = require("./mqtt");

const discovery = require("./discovery");

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

  return new Date() > nextSendForMac[mac];
}

function checkAndSendOveragedData() {
  for (const [mac, value] of Object.entries(valuemap)) {
    if (enoughtData(mac) || dataIsOverdue(mac)) {
      console.log(`Data for mac ${mac} is overdue.`);
      sendDataForTag(mac);
    }
  }
}

function sendDataForTag(mac) {
  var data = getAveragedDataForTag(mac);
  var topic = deviceSettings.getTopicForMac(mac);
  mqtt.publish(topic, JSON.stringify(data));
  reinitData(mac);
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
    entry_count: history.length,
    humidity: Math.round((humidity / history.length) * 10) / 10,
    temperature: Math.round((temperature / history.length) * 100) / 100,
    pressure: Math.round(pressure / history.length) / 100,
    battery: Math.round(
      ((battery / history.length / 1000 - 1.8) / (3.6 - 1.8)) * 100
    ),
  };
}

logger.info("Starting the Ruuvi2MQTT converter.");
logger.info("Settings: " + JSON.stringify(settings));
listener.start(handleRuuviReading, discovery);

setInterval(
  checkAndSendOveragedData,
  Math.ceil((settings.maxWaitSeconds * 1000) / 10)
);
