"use strict";

const listener = require('./listener');

const mqtt = require("./mqtt");

const logger = require("./globals").logger;

const entiresToAggregate = 100;
const forceSendAfterSeconds = 2.5*60;

var valuemap = {};
var lastSendForMac = {};

function handleRuuviReading(mac, tag, data) {
  if (!valuemap[mac]) {
    reinitData(mac, true)
  }

  valuemap[mac].push(data);

  if (enoughtData(mac) || dataIsOverdue(mac)) {
    sendDataForTag(mac);
  }

}

function reinitData(mac, isFirstInit) {
  valuemap[mac] = [];
  if(isFirstInit) {
    //allow for only 15 second aggregation for the first sample from a tag
    lastSendForMac[mac] = new Date(new Date().getTime() - forceSendAfterSeconds*1000 + 15*1000);
  }
  else {
    //allow for normal amount of seconds of aggregation
    lastSendForMac[mac] = new Date();
  }
}

function enoughtData(mac) {
  return valuemap[mac].length >= entiresToAggregate;
}

function dataIsOverdue(mac) {
  if (valuemap[mac].length == 0) 
    return false;

  var ageOfDataInSeconds = (new Date() - lastSendForMac[mac]) / 1000;

  return ageOfDataInSeconds > forceSendAfterSeconds;
}

function sendDataForTag(mac) {
  var history = valuemap[mac];

  var data = getAveragedDataForTag(mac);

  reinitData(mac)

  var topic = `ruuvi/${mac}/status`;

  mqtt.publish(topic , JSON.stringify(data));

}

function handleRuuviTagDiscovery(mac, tag) {
  sendDiscoveryForEntity(mac, tag, 'hum',     'Humidity',    'humidity',    '%H', '{{ value_json.humidity }}');
  sendDiscoveryForEntity(mac, tag, 'temp',    'Temperature', 'temperature', '°C', '{{ value_json.temperature }}');
  sendDiscoveryForEntity(mac, tag, 'battery', 'Battery',     'battery',     '%',  '{{ (((value_json.battery / 1000) - 1.8) / (3.6 - 1.8) * 100) | round(0) | int}}', 'diagnostic');
}

function sendDiscoveryForEntity(mac, tag, suffix, name, deviceClass, unitOfMeasurement, valueTemplate, entityCategory) {
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
    "value_template": valueTemplate,
    "state_class": "measurement"
  };
  if(entityCategory) {
    payload.entity_category = entityCategory
  };

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
    "entry_count": history.length,
    "humidity": Math.round(humidity / history.length * 10) / 10,
    "temperature": Math.round(temperature / history.length * 100) / 100,
    "pressure": Math.round(pressure / history.length * 100) / 100,
    "battery": Math.round(battery / history.length)
  };
}


logger.info("Starting the Ruuvi2MQTT converter.");
listener.start(handleRuuviReading, handleRuuviTagDiscovery);