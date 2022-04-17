"use strict";

const { logger, settings } = require("./globals");

var listener;
if (settings.useDummyData == "true") {
  listener = require("./dummy_listener");
} else {
  listener = require("./listener");
}

const mqtt = require("./mqtt")(settings.mqtt_host, settings.mqtt_port);

var valuemap = {};
var nextSendForMac = {};

function handleRuuviReading(mac, data) {
  if (!valuemap[mac]) {
    reinitData(mac, true);
  }

  valuemap[mac].push(data);

  if (enoughtData(mac) || dataIsOverdue(mac)) {
    sendDataForTag(mac);
  }
}

function reinitData(mac, isFirstInit) {
  valuemap[mac] = [];
  if (isFirstInit) {
    //allow for only 15 second aggregation for the first sample from a tag
    nextSendForMac[mac] = new Date(new Date().getTime() + 15 * 1000);
  } else {
    //allow for normal amount of seconds of aggregation
    nextSendForMac[mac] = new Date(
      new Date().getTime() + settings.maxWaitSeconds * 1000
    );
  }
}

function enoughtData(mac) {
  return valuemap[mac].length >= settings.maxEntriesToAggregate;
}

function dataIsOverdue(mac) {
  if (valuemap[mac].length == 0) return false;

  return new Date() > nextSendForMac[mac];
}

function checkAndSendOveragedData() {
  for (const [mac, value] of Object.entries(valuemap)) {
    if (enoughtData(mac) || dataIsOverdue(mac)) {
      console.log(`Data for mac ${mac} is overdue.`);
      sendDataForTag(mac);
    }
  }
}

function sendDataForTag(mac) {
  var data = getAveragedDataForTag(mac);
  var topic = getTopicForMac(mac);
  mqtt.publish(topic, JSON.stringify(data));
  reinitData(mac);
}

function getTopicForMac(mac) {
  return `${settings.mqtt_topic_prefix}/${mac}/status`;
}

function handleRuuviTagDiscovery(mac) {
  if (!settings.hass_autodiscovery_disable) {
  var mac_compact = mac.replace(/:/g, "").toLowerCase();

    const device_part = {
      connections: [["mac", mac]],
      identifiers: [`RuuviTag ${mac}`],
      manufacturer: "Ruuvi Innovations Ltd",
      model: "RuuviTag",
      name: `RuuviTag ${mac}`,
      via_device: "Docker Ruuvi Service",
    };

    sendDiscoveryForEntity(mac, device_part, {
      suffix: "hum",
      name: "Humidity",
      deviceClass: "humidity",
      unitOfMeasurement: "%H",
      valueTemplate: "{{ value_json.humidity }}",
      expire_after: settings.maxWaitSeconds * 4,
    });
    sendDiscoveryForEntity(mac, device_part, {
      suffix: "temp",
      name: "Temperature",
      deviceClass: "temperature",
      unitOfMeasurement: "°C",
      valueTemplate: "{{ value_json.temperature }}",
      expire_after: settings.maxWaitSeconds * 4,
    });
    sendDiscoveryForEntity(mac, device_part, {
      suffix: "battery",
      name: "Battery",
      deviceClass: "battery",
      unitOfMeasurement: "%",
      valueTemplate:
        "{{ (((value_json.battery / 1000) - 1.8) / (3.6 - 1.8) * 100) | round(0) | int}}",
      entityCategory: "diagnostic",
      expire_after: settings.maxWaitSeconds * 4,
    });
  }
}

function sendDiscoveryForEntity(mac, device_part, attributes) {
  var mac_compact = mac.replace(/:/g, "").toLowerCase();

  var topic = `${settings.hass_autodiscovery_topic_prefix}/sensor/ruuvi_${mac_compact}_${attributes.suffix}/config`;
  var payload = {
    device: device_part,
    device_class: attributes.deviceClass,
    name: `RuuviTag ${mac} ${attributes.name}`,
    object_id: `ruuvi_${mac_compact}_${attributes.suffix}`,
    unique_id: `sensor_mqtt_ruuvi_${mac_compact}_${attributes.suffix}`,
    unit_of_measurement: attributes.unitOfMeasurement,
    state_topic: getTopicForMac(mac),
    value_template: attributes.valueTemplate,
    state_class: "measurement",
    force_update: true,
  };
  if (attributes.expire_after) {
    payload.expire_after = attributes.expire_after;
  }
  if (attributes.entityCategory) {
    payload.entity_category = attributes.entityCategory;
  }

  mqtt.publishRetain(topic, JSON.stringify(payload));
}

function getAveragedDataForTag(tagid) {
  var history = valuemap[tagid];

  var temperature = 0;
  var humidity = 0;
  var pressure = 0;
  var battery = 0;

  history.forEach((data, index) => {
    temperature += data["temperature"];
    humidity += data["humidity"];
    pressure += data["pressure"];
    battery += data["battery"];
  });

  return {
    entry_count: history.length,
    humidity: Math.round((humidity / history.length) * 10) / 10,
    temperature: Math.round((temperature / history.length) * 100) / 100,
    pressure: Math.round((pressure / history.length) * 100) / 100,
    battery: Math.round(battery / history.length),
  };
}

logger.info("Starting the Ruuvi2MQTT converter.");
logger.info("Settings: " + JSON.stringify(settings));
listener.start(handleRuuviReading, handleRuuviTagDiscovery);

setInterval(
  checkAndSendOveragedData,
  Math.ceil((settings.maxWaitSeconds * 1000) / 10)
);
