"use strict";

const { logger, settings } = require("../globals");

const mqtt = require("../mqtt");

function handleRuuviReading(mac, data) {
  var payload = Object.assign({}, data);
  payload.relayNode = settings.node_name;
  mqtt.publish(
    `${settings.mqtt_topic_prefix}/raw_forward/reading/${mac}`,
    JSON.stringify(payload)
  );
}

function checkAndSendOveragedData() {}

module.exports = {
  handleRuuviReading: handleRuuviReading,
  checkAndSendOveragedData: checkAndSendOveragedData,
};
