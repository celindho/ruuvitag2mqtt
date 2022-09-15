"use strict";

const { logger, settings } = require("./globals");

const mqtt = require("./mqtt");

function start(handleRuuviReading, handleRuuviDiscovery) {
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

module.exports = { start: start };
