"use strict";

const ruuvi = require('node-ruuvitag');

function start(dataCallback) {
    ruuvi.on('found', tag => {
        tag.on('updated', data => {
            dataCallback(convertIdToMac(tag.id), data);
        });
    });

    ruuvi.on('warning', message => {
        console.error(new Error(message));
    });
}

function convertIdToMac(id) {
    return id.match(new RegExp('.{1,2}', 'g')).join(":").toUpperCase();
}


module.exports = {
    start: start
}