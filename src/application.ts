import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {LoggingBindings, LoggingComponent, WinstonLoggerOptions} from '@loopback/logging';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import winston from 'winston';
import {MySequence} from './sequence';

export {ApplicationConfig};

export class QuoteApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // use my single instance Winston logger
    // this.bind(MY_WINSTON_LOGGER).toProvider(MyWinstonLoggerProvider);
    // this.bind(LoggingBindings.WINSTON_LOGGER)
    //   .toProvider(MyWinstonLoggerProvider);
    // this.bind('logging.winston.invocationLogger')
    //   .toProvider(MyWinstonLoggerProvider);
    //   .inScope(BindingScope.SINGLETON);
    // this.bind(LoggingBindings.WINSTON_INVOCATION_LOGGER).toProvider(MyWinstonLoggerProvider)
    //   .inScope(BindingScope.SINGLETON);

    // Configure LoopBack logging
    this.configureLogging();

    // load environment variables from file .env
    require('dotenv').config();

    console.log(`NODE_ENV=${process.env.NODE_ENV}`);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/v1/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  /**
   * Configure Winston logging into file 'development.log'.
   */
  private configureLogging(): void {

    // configure the main logging component (must be called before this.component() to take effect)
    this.configure(LoggingBindings.COMPONENT).to({
      enableFluent: false,
      enableHttpAccessLog: true
    });

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

    // configure Winston logger
    this.configure<WinstonLoggerOptions>(LoggingBindings.WINSTON_LOGGER).to({
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      // format: winston.format.json(),
      // format: winston.format.combine(
      //   winston.format.timestamp(),
      //   customFormatter
      // ),
      defaultMeta: {Application: 'quote_api'},
      transports: [
        new winston.transports.File({
          filename: process.env.NODE_ENV === 'production' ?
            'production.log' :
            'development.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            customFormatter
          ),
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
        })
      ]
    });

    // add logging component
    this.component(LoggingComponent);

  }
}
