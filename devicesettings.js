const { logger, settings } = require("./globals");
function getTopicForMac(mac) {
  return `${settings.mqtt_topic_prefix}/${mac}/status`;
}

module.exports = {
  getTopicForMac: getTopicForMac,
};
