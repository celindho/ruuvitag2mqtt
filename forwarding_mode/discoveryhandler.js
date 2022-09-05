"use strict";

const { logger, settings } = require("../globals");

const mqtt = require("../mqtt");

function handleRuuviTagDiscovery(mac) {
  mqtt.publish(
    `${settings.mqtt_topic_prefix}/raw_forward/discovery/${mac}`,
    mac
  );
}

module.exports = handleRuuviTagDiscovery;
