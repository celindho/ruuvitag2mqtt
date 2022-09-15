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

if (settings.forwarding_mode) {
  var handleRuuviDiscovery = require("./forwarding_mode/discoveryhandler");
  var handleRuuviReading =
    require("./forwarding_mode/devicemessagehandler").handleRuuviReading;

  listener.start(handleRuuviReading, handleRuuviDiscovery);
} else {
  var handleRuuviDiscovery = require("./default_mode/discoveryhandler");
  var {
    handleRuuviReading,
    checkAndSendOveragedData,
  } = require("./default_mode/devicemessagehandler");

  listener.start(handleRuuviReading, handleRuuviDiscovery);

  require("./mqtt_listener").start(handleRuuviReading, handleRuuviDiscovery);

  setInterval(
    checkAndSendOveragedData,
    Math.ceil((settings.maxWaitSeconds * 1000) / 10)
  );
}

mqtt.publish(
  `${settings.mqtt_topic_prefix}/broker/status`,
  "Ruuvi2MQTT started."
);

logger.info("Started the Ruuvi2MQTT converter.");
