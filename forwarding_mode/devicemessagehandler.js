"use strict";

const { logger, settings } = require("../globals");

const mqtt = require("../mqtt");

function handleRuuviReading(mac, data) {
  mqtt.publish(
    `${settings.mqtt_topic_prefix}/raw_forward/reading/${mac}`,
    JSON.stringify(data)
  );
}

function checkAndSendOveragedData() {}

module.exports = {
  handleRuuviReading: handleRuuviReading,
  checkAndSendOveragedData: checkAndSendOveragedData,
};
