"use strict";

const fs = require('fs');
const listener = require('./listener');


var values = [];

listener.start((tagid, tag, data) => values.push({ tagid: tagid, tag: tag, data: data }));


setTimeout(() => {
    var writeData = JSON.stringify(values)
    console.log("Writing Data: ", writeData);
    fs.writeFile("output.json", writeData, (err) => { console.error(err); process.exit(0); });
}, 60 * 1000);