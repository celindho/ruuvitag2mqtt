const { logger, settings } = require("./globals");

const removeAccents = require("remove-accents");

const deviceStore = require("data-store")("ruuvitags", {
  path: settings.config_folder + "/devices.json",
});

function getByMac(mac) {
  if (!deviceStore.has(mac)) {
    deviceStore.set(mac, { name: null, area: null });
    deviceStore.save();
  }
  return deviceStore.get(mac);
}

function getNameByMac(mac) {
  return getByMac(mac).name || `RuuviTag ${mac}`;
}

function getEscapedNameByMac(mac) {
  var name = getNameByMac(mac);
  return removeAccents(name)
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/ +/g, "_");
}

function getAreaByMac(mac) {
  return getByMac(mac).area;
}

function getTopicForMac(mac) {
  return `${settings.mqtt_topic_prefix}/${mac}/status`;
}

function getTasmotaTemperatureTopicsByMac(mac) {
  var topics = getByMac(mac).tasmotaTemperatureTopics;
  return Array.isArray(topics) || !topics ? topics : [topics];
}

module.exports = {
  getNameByMac: getNameByMac,
  getAreaByMac: getAreaByMac,
  getTopicForMac: getTopicForMac,
  getEscapedNameByMac: getEscapedNameByMac,
  getTasmotaTemperatureTopicsByMac: getTasmotaTemperatureTopicsByMac,
};
