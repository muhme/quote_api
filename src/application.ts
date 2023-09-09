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
import debug from 'debug';
import path from 'path';
import * as util from 'util';
import winston from 'winston';
import {MySequence} from './sequence';

export {ApplicationConfig};

export class QuoteApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // load environment variables from file .env
    require('dotenv').config();

    // MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 finish listeners added to [File]. Use emitter.setMaxListeners() to increase limit
    require('events').EventEmitter.defaultMaxListeners = 30; // TODO

    // Configure logging
    // this.configureLogging();

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
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
     * we have:
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
      level: 'debug',
      // format: format.json(),
      format: winston.format.combine(
        winston.format.timestamp(),
        customFormatter
      ),
      defaultMeta: {Application: 'QuoteApi'},
      transports: [
        new winston.transports.File({filename: 'development.log', level: 'debug'})
      ]
    });

    // add logging component
    this.component(LoggingComponent);

    // redirect debug module's output to Winston
    // (use void to intentionally ignore the promise)
    // eslint-disable-next-line no-void
    // void this.redirectDebugToWinston();
  }

  /**
   * Redirect the debug module output (used by loopback-connector-mysql and many
   * other modules) to Winston (same as @loopback/logging), hook into the debug
   * module and override its log function to send messages to Winston.
   */
  private async redirectDebugToWinston(): Promise<void> {

    const logger = await this.get(LoggingBindings.WINSTON_LOGGER);

    debug.log = (...args: string[]) => {
      const namespace = args[0].split(' ')[0];
      console.log(`NAMESPACE ${namespace}`);
      console.log(`ARGS ${args}`);
      const message = util.format(...args).replace(`${namespace} `, '');
      logger.debug(`[${namespace}] ${message}`);
    };
  }

}

// function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
//   req.requestId = Date.now();  // time as milliseconds since 1970
//   next();
// }
// function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
//   const requestId = Date.now();
//   const ctx = req.app.get(RestBindings.Http.CONTEXT);
//   ctx.bind('requestId').to(requestId);
//   next();
// }
