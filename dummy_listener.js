"use strict";
const logger = require("./globals").logger;
const fs = require("fs");

function start(dataCallback, discoveryCallback) {
  logger.info("Generating dummy callbacks.");

  try {
    const data = JSON.parse(fs.readFileSync("testdata.json", "utf8"));
    console.log(data);

    var tags = [];
    data.forEach((entry) => {
      if (!tags.includes(entry.tagid)) {
        tags.push(entry.tagid);
        discoveryCallback(entry.tagid);
      }
      dataCallback(entry.tagid, entry.data);
    });
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  start: start,
};
