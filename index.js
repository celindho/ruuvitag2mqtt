"use strict";

const { logger, settings } = require("./globals");

const mqtt = require("./mqtt");

var listener;
if (settings.useDummyData == "true") {
  listener = require("./dummy_listener");
} else {
  listener = require("./listener");
}

logger.info("Starting the Ruuvi2MQTT converter.");
logger.info("Settings: " + JSON.stringify(settings));

var handleRuuviDiscovery, handleRuuviReading, checkAndSendOveragedData;

if (settings.forwarding_mode) {
  handleRuuviDiscovery = require("./forwarding_mode/discoveryhandler");
  handleRuuviReading =
    require("./forwarding_mode/devicemessagehandler").handleRuuviReading;
} else {
  handleRuuviDiscovery = require("./discoveryhandler");
  handleRuuviReading = require("./devicemessagehandler").handleRuuviReading;
  checkAndSendOveragedData =
    require("./devicemessagehandler").checkAndSendOveragedData;
}

listener.start(handleRuuviReading, handleRuuviDiscovery);
mqtt.publish(
  `${settings.mqtt_topic_prefix}/broker/status`,
  "Ruuvi2MQTT started."
);

if (checkAndSendOveragedData) {
  setInterval(
    checkAndSendOveragedData,
    Math.ceil((settings.maxWaitSeconds * 1000) / 10)
  );
}

logger.info("Started the Ruuvi2MQTT converter.");
