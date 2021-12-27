"use strict";

const ruuvi = require('node-ruuvitag');

const logger = require("./globals").logger;

function start(dataCallback, foundCallback) {
    ruuvi.on('found', tag => {
        logger.info("Found tag: " + JSON.stringify(tag));
        if(foundCallback) {foundCallback(convertIdToMac(tag.id), tag);}
        tag.on('updated', data => {
            dataCallback(convertIdToMac(tag.id), data);
        });
    });

    ruuvi.on('warning', message => {
        logger.error(new Error(message));
    });
}

function convertIdToMac(id) {
    return id.match(new RegExp('.{1,2}', 'g')).join(":").toUpperCase();
}


module.exports = {
    start: start
}