const winston = require("winston");

const { splat, combine, timestamp, printf } = winston.format;

// meta param is ensured by splat()
const myFormat = printf(({ timestamp, level, message, meta }) => {
  return `${timestamp};${level};${message};${meta? JSON.stringify(meta) : ''}`;
});

const logger = winston.createLogger(
  {
    level: 'info',
    format: combine(
      timestamp(),
      splat(),
      myFormat
    ),
    transports: [new winston.transports.Console()]
  }
);

module.exports = {
  logger: logger
};