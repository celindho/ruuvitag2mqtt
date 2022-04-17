"use strict";

const { logger, settings, getTopicForMac } = require("./globals");

const mqtt = require("./mqtt");

//const deviceSettings = require("./devicesettings");

function handleRuuviTagDiscovery(mac) {
  if (!settings.hass_autodiscovery_disable) {
    var mac_compact = mac.replace(/:/g, "").toLowerCase();

    const device_part = {
      connections: [["mac", mac]],
      identifiers: [`RuuviTag ${mac}`],
      manufacturer: "Ruuvi Innovations Ltd",
      model: "RuuviTag",
      name: `RuuviTag ${mac}`,
      //name: deviceSettings.getNameByMac(mac),
      //suggested_area: deviceSettings.getAreaByMac(mac),
      via_device: "Docker Ruuvi Service",
    };

    var sensors = [
      {
        suffix: "hum",
        name: "Humidity",
        deviceClass: "humidity",
        unitOfMeasurement: "%H",
        valueTemplate: "{{ value_json.humidity }}",
        expire_after: settings.maxWaitSeconds * 4,
      },
      {
        suffix: "temp",
        name: "Temperature",
        deviceClass: "temperature",
        unitOfMeasurement: "°C",
        valueTemplate: "{{ value_json.temperature }}",
        expire_after: settings.maxWaitSeconds * 4,
      },
      {
        suffix: "pressure",
        name: "Pressure",
        deviceClass: "pressure",
        unitOfMeasurement: "hPa",
        valueTemplate: "{{ value_json.pressure}}",
        expire_after: settings.maxWaitSeconds * 4,
      },
      {
        suffix: "battery",
        name: "Battery",
        deviceClass: "battery",
        unitOfMeasurement: "%",
        valueTemplate: "{{ value_json.battery}}",
        entityCategory: "diagnostic",
        expire_after: settings.maxWaitSeconds * 4,
      },
    ];

    sensors.forEach((attributes) => {
      var entity = {
        device_class: attributes.deviceClass,
        name: `RuuviTag ${mac} ${attributes.name}`,
        //name: `${deviceSettings.getNameByMac(mac)} ${attributes.name}`,
        object_id: `ruuvi_${mac_compact}_${attributes.suffix}`,
        unique_id: `sensor_mqtt_ruuvi_${mac_compact}_${attributes.suffix}`,
        unit_of_measurement: attributes.unitOfMeasurement,
        state_topic: getTopicForMac(mac),
        value_template: attributes.valueTemplate,
        state_class: "measurement",
        force_update: true,
      };
      if (attributes.expire_after) {
        entity.expire_after = attributes.expire_after;
      }
      if (attributes.entityCategory) {
        entity.entity_category = attributes.entityCategory;
      }
    });

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
      valueTemplate: "{{ value_json.battery}}",
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
    //name: `${deviceSettings.getNameByMac(mac)} ${attributes.name}`,
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

module.exports = handleRuuviTagDiscovery;
