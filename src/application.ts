import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {LoggingBindings, LoggingComponent, WinstonLoggerOptions, format} from '@loopback/logging';
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

    // Configure logging
    this.configureLogging();

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

    // configure Winston logger
    this.configure<WinstonLoggerOptions>(LoggingBindings.WINSTON_LOGGER).to({
      level: 'debug',
      format: format.json(),
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
    void this.redirectDebugToWinston();
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
