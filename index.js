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
  handleRuuviDiscovery = require("./default_mode/discoveryhandler");
  handleRuuviReading = require("./default_mode/devicemessagehandler").handleRuuviReading;
  checkAndSendOveragedData =
    require("./default_mode/devicemessagehandler").checkAndSendOveragedData;
}

listener.start(handleRuuviReading, handleRuuviDiscovery);

function mqttListener(topic, payload, packet) {
  const discoveryRegEx = new RegExp(
    `^${settings.mqtt_topic_prefix}/raw_forward/discovery/`
  );
  const dataRegEx = new RegExp(
    `^${settings.mqtt_topic_prefix}/raw_forward/reading/`
  );

  if (dataRegEx.test(topic)) {
    const mac = /[^\/]+$/gm.exec(topic)[0];
    handleRuuviReading(mac, JSON.parse(payload.toString()));
  } else if (discoveryRegEx.test(topic)) {
    const mac = payload;
    handleRuuviDiscovery(mac);
  }
}
mqtt.registerListener(mqttListener);
mqtt.subscribe(`${settings.mqtt_topic_prefix}/raw_forward/#`);

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
