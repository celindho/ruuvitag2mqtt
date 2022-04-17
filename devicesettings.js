const { logger, settings } = require("./globals");

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

function getAreaByMac(mac) {
  return getByMac(mac).area;
}

function getTopicForMac(mac) {
  return `${settings.mqtt_topic_prefix}/${mac}/status`;
}

module.exports = {
  getNameByMac: getNameByMac,
  getAreaByMac: getAreaByMac,
  getTopicForMac: getTopicForMac,
};
