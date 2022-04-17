"use strict";

const { logger, settings } = require("./globals");

const deviceSettings = require("./devicesettings");

var listener;
if (settings.useDummyData == "true") {
  listener = require("./dummy_listener");
} else {
  listener = require("./listener");
}

const discovery = require("./discovery");

const {
  handleRuuviReading,
  checkAndSendOveragedData,
} = require("./devicemessagehandler");

logger.info("Starting the Ruuvi2MQTT converter.");
logger.info("Settings: " + JSON.stringify(settings));
listener.start(handleRuuviReading, discovery);

setInterval(
  checkAndSendOveragedData,
  Math.ceil((settings.maxWaitSeconds * 1000) / 10)
);
