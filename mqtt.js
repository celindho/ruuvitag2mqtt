"use strict";
const mqtt = require('mqtt');

const logger = require("./globals").logger;

var mqtt_client;

function publish(topic, message) {
  mqtt_client.publish(topic, message);
}

function createMqttClient() {
  if (!mqtt_client) {
    var mqtt_host = "192.168.1.173";
    var mqtt_port = 1883;
    logger.info("MQTT connecting to %s:%d.", mqtt_host, mqtt_port);
    mqtt_client = mqtt.connect({ host: mqtt_host, port: mqtt_port, connectTimeout: 60 * 1000, clientId: "ruuvi2mqtt_"+Math.floor(Math.random()*1000) });
    mqtt_client.on("connect", () => {
      logger.info("MQTT connected to. %s:%d.", mqtt_host, mqtt_port);
    });    
    mqtt_client.on("error", (e) => {
      logger.error("MQTT Error, exiting program: ", e.message);
      process.exit(1);
    });
  }
}

createMqttClient();

module.exports = {
  publish: publish
}