"use strict";
const mqtt = require("./mqtt");

const logger = require("./globals").logger;

mqtt.publish("foo/bar", "This should be a retained message", { retain: true });
