"use strict";

const ruuvi = require("node-ruuvitag");

const logger = require("./globals").logger;

const bridgeStatus = require("./bridge_status");

function start(dataCallback, discoveryCallback) {
  ruuvi.on("found", (tag) => {
    logger.info("Found tag: " + JSON.stringify(tag));
    if (discoveryCallback) {
      discoveryCallback(convertIdToMac(tag.id));
    }
    tag.on("updated", (data) => {
      bridgeStatus.registerBTMessage(convertIdToMac(tag.id));
      dataCallback(convertIdToMac(tag.id), data);
    });
  });

  ruuvi.on("warning", (message) => {
    logger.error(new Error(message));
  });
}

function convertIdToMac(id) {
  return id.match(new RegExp(".{1,2}", "g")).join(":").toUpperCase();
}

module.exports = {
  start: start,
};
