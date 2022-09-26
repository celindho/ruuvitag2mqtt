"use strict";

const { logger, settings } = require("../globals");

const mqtt = require("../mqtt");

const removeAccents = require("remove-accents");

function getEscapedBridgeName() {
  return removeAccents(settings.node_name)
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/ +/g, "_");
}

function bridgeDiscovery() {
  var bridgeName = settings.node_name;
  var escapedBridgeName = getEscapedBridgeName();
  var buildVersion = "0.9";

  const bridgeDevice = {
    identifiers: [`RuuviTag to MQTT bridge ${bridgeName}`],
    manufacturer: "Christian Lindholm",
    model: "Ruuvi2MQTT bridge",
    name: `Ruuvi Bridge ${bridgeName}`,
    sw_version: buildVersion,
  };

  var sensors = [
    {
      name: "Started",
      device_class: "timestamp",
      entity_category: "diagnostic",
      object_id: `${escapedBridgeName}_started`,
      unique_id: `sensor_mqtt_ruuvi_bridge_${escapedBridgeName}_started`,
      state_topic: `${settings.mqtt_topic_prefix}/broker/${escapedBridgeName}/startup`,
      value_template: "{{ value_json.started }}",
    },
    {
      name: "Mode",
      entity_category: "diagnostic",
      object_id: `${escapedBridgeName}_mode`,
      unique_id: `sensor_mqtt_ruuvi_bridge_${escapedBridgeName}_mode`,
      state_topic: `${settings.mqtt_topic_prefix}/broker/${escapedBridgeName}/startup`,
      value_template: "{{ value_json.mode }}",
    },
    {
      name: "Devices connected",
      expire_after: 120,
      entity_category: "diagnostic",
      object_id: `${escapedBridgeName}_devices`,
      unique_id: `sensor_mqtt_ruuvi_bridge_${escapedBridgeName}_devices`,
      state_topic: `${settings.mqtt_topic_prefix}/broker/${escapedBridgeName}/status`,
      value_template: "{{ value_json.devices }}",
    },
    {
      name: "BT messages processed",
      expire_after: 120,
      entity_category: "diagnostic",
      unit_of_measurement: "1/min",
      object_id: `${escapedBridgeName}_messages`,
      unique_id: `sensor_mqtt_ruuvi_bridge_${escapedBridgeName}_messages`,
      state_topic: `${settings.mqtt_topic_prefix}/broker/${escapedBridgeName}/status`,
      value_template: "{{ value_json.messages }}",
    },
  ];

  sensors.forEach((sensor) => {
    var discoveryTopic = `${settings.hass_autodiscovery_topic_prefix}/sensor/${sensor.unique_id}/config`;
    sensor.device = bridgeDevice;
    mqtt.publishRetain(discoveryTopic, JSON.stringify(sensor));
  });
}

var bluetoothMsgCounter;

function registerBTMessage(mac) {
  if (!bluetoothMsgCounter[mac]) {
    bluetoothMsgCounter[mac] = 0;
  }
  bluetoothMsgCounter[mac]++;
}

function sendHealthMessages() {
  var btMsgCounterCopy = bluetoothMsgCounter;
  bluetoothMsgCounter = {};

  var totalBTMessages = 0;

  Object.keys(btMsgCounterCopy).forEach((mac) => {
    totalBTMessages += btMsgCounterCopy[mac];
  });

  var statusTopic = `${
    settings.mqtt_topic_prefix
  }/broker/${getEscapedBridgeName()}/status`;
  var status = {
    devices: Object.keys(btMsgCounterCopy).length,
    messages: totalBTMessages,
  };

  mqtt.publish(statusTopic, JSON.stringify(status));
}

function sendInitMessages() {
  var startedTopic = `${
    settings.mqtt_topic_prefix
  }/broker/${getEscapedBridgeName()}/startup`;
  var startup = {
    started: new Date().toISOString(),
    mode: settings.forwarding_mode ? "MQTT Forwarding" : "Central Aggregator",
  };

  mqtt.publish(startedTopic, JSON.stringify(startup));
}

function init() {
  bluetoothMsgCounter = {};
  bridgeDiscovery();
  sendInitMessages();
  setInterval(sendHealthMessages, Math.ceil(60 * 1000));
}

module.exports = {
  init: init,
  registerBTMessage: registerBTMessage,
};
