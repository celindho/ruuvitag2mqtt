"use strict";

const { logger, settings } = require("./globals");

const mqtt = require("./mqtt");

const deviceSettings = require("./devicesettings");

function handleRuuviTagDiscovery(mac) {
  if (!settings.hass_autodiscovery_disable) {
    var mac_compact = mac.replace(/:/g, "").toLowerCase();

    const device = {
      connections: [["mac", mac]],
      identifiers: [`RuuviTag ${mac}`],
      manufacturer: "Ruuvi Innovations Ltd",
      model: "RuuviTag",
      name: deviceSettings.getNameByMac(mac),
      suggested_area: deviceSettings.getAreaByMac(mac),
      via_device: "Docker Ruuvi Service",
    };

    var sensors = [
      {
        name: "Humidity",
        deviceClass: "humidity",
        unitOfMeasurement: "%H",
        valueTemplate: "{{ value_json.humidity }}",
        expire_after: settings.maxWaitSeconds * 4,
      },
      {
        name: "Temperature",
        deviceClass: "temperature",
        unitOfMeasurement: "°C",
        valueTemplate: "{{ value_json.temperature }}",
        expire_after: settings.maxWaitSeconds * 4,
      },
      {
        name: "Pressure",
        deviceClass: "pressure",
        unitOfMeasurement: "hPa",
        valueTemplate: "{{ value_json.pressure}}",
        expire_after: settings.maxWaitSeconds * 4,
      },
      {
        name: "Battery",
        deviceClass: "battery",
        unitOfMeasurement: "%",
        valueTemplate: "{{ value_json.battery}}",
        entityCategory: "diagnostic",
      },
      {
        name: "MAC",
        valueTemplate: "{{ value_json.mac}}",
        entityCategory: "diagnostic",
      },
      {
        name: "RSSI",
        deviceClass: "signal_strength",
        valueTemplate: "{{ value_json.rssi}}",
        entityCategory: "diagnostic",
        expire_after: settings.maxWaitSeconds * 2,
      },
    ];

    sensors.forEach((attributes) => {
      var escapedName = attributes.name.toLowerCase().replace(/ +/g, "_");

      var entity = {
        device: device,
        name: `${deviceSettings.getNameByMac(mac)} ${attributes.name}`,
        object_id: `${deviceSettings.getEscapedNameByMac(
          mac
        )}_${attributes.name.toLowerCase()}`,
        unique_id: `sensor_mqtt_ruuvi_${mac_compact}_${escapedName}`,
        state_topic: deviceSettings.getTopicForMac(mac),
        value_template: attributes.valueTemplate,
        state_class: "measurement",
        force_update: true,
      };
      if (attributes.unitOfMeasurement) {
        entity.unit_of_measurement = attributes.unitOfMeasurement;
      }
      if (attributes.deviceClass) {
        entity.device_class = attributes.deviceClass;
      }
      if (attributes.expire_after) {
        entity.expire_after = attributes.expire_after;
      }
      if (attributes.entityCategory) {
        entity.entity_category = attributes.entityCategory;
      }

      var discoveryTopic = `${settings.hass_autodiscovery_topic_prefix}/sensor/ruuvi_${mac_compact}_${escapedName}/config`;

      mqtt.publishRetain(discoveryTopic, JSON.stringify(entity));
    });
  }
}

module.exports = handleRuuviTagDiscovery;
