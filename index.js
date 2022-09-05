"use strict";

const { logger, settings } = require("./globals");

var listener;
if (settings.useDummyData == "true") {
  listener = require("./dummy_listener");
} else {
  listener = require("./listener");
}

const handleRuuviDiscovery = require("./discoveryhandler");

const {
  handleRuuviReading,
  checkAndSendOveragedData,
} = require("./devicemessagehandler");

logger.info("Starting the Ruuvi2MQTT converter.");
logger.info("Settings: " + JSON.stringify(settings));
listener.start(handleRuuviReading, handleRuuviDiscovery);

setInterval(
  checkAndSendOveragedData, 
  Math.ceil((settings.maxWaitSeconds * 1000) / 10)
);
