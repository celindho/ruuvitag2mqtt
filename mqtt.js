"use strict";
const mqtt = require("mqtt");

const { logger, settings } = require("./globals");

var mqtt_client;

function publish(topic, message, options) {
  mqtt_client.publish(topic, message, options);
}

function publishRetain(topic, message) {
  mqtt_client.publish(topic, message, { retain: true });
}

function createMqttClient(mqtt_host, mqtt_port) {
  if (!mqtt_client) {
    logger.info("MQTT connecting to %s:%d.", mqtt_host, mqtt_port);
    mqtt_client = mqtt.connect({
      host: mqtt_host,
      port: mqtt_port,
      connectTimeout: 60 * 1000,
      clientId: "ruuvi2mqtt_" + Math.floor(Math.random() * 1000),
    });
    mqtt_client.on("connect", () => {
      logger.info("MQTT connected to. %s:%d.", mqtt_host, mqtt_port);
    });
    mqtt_client.on("error", (e) => {
      logger.error("MQTT Error, exiting program: ", e.message);
      process.exit(1);
    });
  }
}

createMqttClient(settings.mqtt_host, settings.mqtt_port);

module.exports = {
  publish: publish,
  publishRetain: publishRetain,
};
