import {BindingScope, Provider, ValueOrPromise, bind, inject} from '@loopback/core';
import {LoggingBindings, WinstonLogger} from '@loopback/logging';

@bind({scope: BindingScope.TRANSIENT})
export class LoggerProvider implements Provider<MyLogger> {
  constructor(
    @inject('requestId', {optional: true}) private requestId: string,
    // @loopback/logging winston logger
    @inject(LoggingBindings.WINSTON_LOGGER) private logger: WinstonLogger
  ) { }

  value(): ValueOrPromise<MyLogger> {
    return {
      log: (level: string, message: string) => {
        const requestId = this.requestId;
        const started = Number(requestId);
        const milliseconds = isNaN(started) ? -1 : Date.now() - started;
        const ri = isNaN(started) ? 'no-requestId' : started.toString(16).toUpperCase();
        // Utilizing the log method of Winston and providing the level dynamically
        this.logger.log(level, `[${ri}] +${milliseconds}ms ${message}`);
      }
    };
  }
}

export interface MyLogger {
  log(level: string, message: string): void;
}
