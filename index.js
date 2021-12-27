"use strict";

const listener = require('./listener');

const mqtt = require("./mqtt");

const logger = require("./globals").logger;

const entiresToAggregate = 25;

var valuemap = {};

function handleRuuviReading(tagid, data) {
  if (!valuemap[tagid]) {
    valuemap[tagid] = [];
  }

  valuemap[tagid].push(data);

  if (valuemap[tagid].length >= entiresToAggregate) {
    sendDataForTag(tagid);
  }

}

function sendDataForTag(tagid) {
  var history = valuemap[tagid];

  var data = getAveragedDataForTag(tagid);

  valuemap[tagid] = [];

  var topic = `ruuvi/${tagid}/status`;

  mqtt.publish(topic , JSON.stringify(data));

}

function handleNewRuuviTag(mac, tag) {
  sendDiscoveryForTag(mac, tag, 'hum',     'Humidity',    'humidity',    '%H', '{{ value_json.humidity }}');
  sendDiscoveryForTag(mac, tag, 'temp',    'Temperature', 'temperature', '°C', '{{ value_json.temperature }}');
  sendDiscoveryForTag(mac, tag, 'battery', 'Battery',     'battery',     '%',  '{{ (((value_json.battery / 1000) - 1.8) / (3.6 - 1.8) * 100) | round(0) | int}}', 'diagnostic');
}

function sendDiscoveryForTag(mac, tag, suffix, name, deviceClass, unitOfMeasurement, valueTemplate, entityCategory) {
  var topic = `homeassistant/sensor/ruuvi_${tag.id}_${suffix}/config`;
  var payload = {
    "device": {
      "connections": [ ["mac", mac]],
      "identifiers": [`RuuviTag ${mac}`],
      "manufacturer": "Ruuvi Innovations Ltd",
      "model": "RuuviTag",
      "name": `RuuviTag ${mac}`,
      "via_device": "Docker Ruuvi Service"
    },
    "device_class": deviceClass,
    "name": `RuuviTag ${mac} ${name}`,
    "object_id": `ruuvi_${tag.id}_${suffix}`,
    "unique_id": `sensor_mqtt_ruuvi_${tag.id}_${suffix}`,
    "unit_of_measurement": unitOfMeasurement,
    "state_topic": `ruuvi/${mac}/status`,
    "value_template": valueTemplate
  };
  if(entityCategory) {
    payload.entity_category = entityCategory
  };

  mqtt.publish(topic, JSON.stringify(payload));

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
    "entry_count": history.length,
    "humidity": Math.round(humidity / history.length * 10) / 10,
    "temperature": Math.round(temperature / history.length * 100) / 100,
    "pressure": Math.round(pressure / history.length * 100) / 100,
    "battery": Math.round(battery / history.length)
  };
}


logger.info("Starting the Ruuvi2MQTT converter.");
listener.start(handleRuuviReading, handleNewRuuviTag);