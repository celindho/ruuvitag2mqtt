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
  var {handleRuuviReading, checkAndSendOveragedData} =
    require("./default_mode/devicemessagehandler");

  listener.start(handleRuuviReading, handleRuuviDiscovery);

  setInterval(
    checkAndSendOveragedData,
    Math.ceil((settings.maxWaitSeconds * 1000) / 10)
  );

  const discoveryRegEx = new RegExp(
    `^${settings.mqtt_topic_prefix}/raw_forward/discovery/`
  );
  const dataRegEx = new RegExp(
    `^${settings.mqtt_topic_prefix}/raw_forward/reading/`
  );

  function mqttListener(topic, payload, packet) {
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
}

mqtt.publish(
  `${settings.mqtt_topic_prefix}/broker/status`,
  "Ruuvi2MQTT started."
);

logger.info("Started the Ruuvi2MQTT converter.");
