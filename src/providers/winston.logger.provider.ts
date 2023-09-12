import {inject, Provider, ValueOrPromise} from '@loopback/core';
import winston from 'winston';

interface MyLogger {
  log: (level: string, message: string) => void;
}

export class WinstonLoggerProvider implements Provider<MyLogger> {
  private loggerInstance: winston.Logger;

  constructor(
    @inject('requestId', {optional: true}) private requestId: string
  ) {

    /**
     * format e.g. "230830 04:20:41.366    DEBUG [18A44AC0F13] +3ms @get/authors"
     * we have npm levels:
     *   ERROR   0: Error level log.
     *   WARN    1: Warning level log.
     *   INFO    2: Informational log.
     *   HTTP    3: HTTP request log. Useful for logging HTTP requests.
     *   VERBOSE 4: More detailed than the info level.
     *   DEBUG   5: Used for debugging purposes.
     *   SILLY   6: The most detailed or stupid log level.
     */
    const customFormatter = winston.format.printf(({timestamp, level, message}) => {
      // Extract day, month, year, hours, minutes, seconds, and milliseconds from timestamp
      const date = new Date(timestamp);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(2); // get last two digits of year
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

      return `${year}${month}${day} ${hours}:${minutes}:${seconds}.${milliseconds} ${level.padStart(8).toUpperCase()} ${message}`;
    });

    this.loggerInstance = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      defaultMeta: {Application: 'quote_api'},
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            customFormatter
          ),
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
        }),
      ],
    });
  }

  value(): ValueOrPromise<MyLogger> {
    return {
      log: (level: string, message: string) => {
        const requestId = this.requestId;
        const started = Number(requestId);
        const milliseconds = isNaN(started) ? -1 : Date.now() - started;
        const ri = isNaN(started) ? 'no-requestId' : started.toString(16).toUpperCase();
        // Utilizing the log method of Winston and providing the level dynamically
        this.loggerInstance.log(level, `[${ri}] +${milliseconds}ms ${message}`);
      },
    };
  }
}
