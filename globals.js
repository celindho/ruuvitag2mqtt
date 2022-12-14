var settings;

function getLogger() {
  const winston = require("winston");
  const { splat, combine, timestamp, printf } = winston.format;

  // meta param is ensured by splat()
  const myFormat = printf(({ timestamp, level, message, meta }) => {
    return `${timestamp};${level};${message};${
      meta ? JSON.stringify(meta) : ""
    }`;
  });

  const logger = winston.createLogger({
    level: "info",
    format: combine(timestamp(), splat(), myFormat),
    transports: [new winston.transports.Console()],
  });
  return logger;
}

function getSettings() {
  if (!settings) {
    const commandLineArgs = require("command-line-args");

    const argsDefinitions = [
      {
        name: "mqtt_host",
        alias: "h",
        type: String,
        defaultValue: "localhost",
      },
      { name: "mqtt_port", alias: "p", type: Number, defaultValue: 1883 },
      {
        name: "mqtt_topic_prefix",
        alias: "t",
        type: String,
        defaultValue: "ruuvi",
      },
      {
        name: "hass_autodiscovery_disable",
        alias: "d",
        type: Boolean,
        defaultValue: false,
      },
      {
        name: "hass_autodiscovery_topic_prefix",
        alias: "x",
        type: String,
        defaultValue: "homeassistant",
      },
      {
        name: "maxEntriesToAggregate",
        alias: "n",
        type: Number,
        defaultValue: 100,
      },
      {
        name: "maxWaitSeconds",
        alias: "s",
        type: Number,
        defaultValue: 2.5 * 60,
      },
      { name: "useDummyData", type: String },
      {
        name: "config_folder",
        type: String,
        defaultValue: process.cwd() + "/.config",
      },
      {
        name: "node_name",
        type: String,
        defaultValue: require("os").hostname(),
      },
      {
        name: "forwarding_mode",
        alias: "f",
        type: Boolean,
        defaultValue: false,
      },
    ];

    const args = commandLineArgs(argsDefinitions);

    //override with environment variables if available
    argsDefinitions.forEach((def) => {
      if (process.env[def.name]) {
        args[def.name] = process.env[def.name];
      }
    });

    settings = args;
  }
  return settings;
}


module.exports = {
  logger: getLogger(),
  settings: getSettings(),
};
