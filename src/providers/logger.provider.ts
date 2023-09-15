import {bind, BindingScope} from '@loopback/core';
import {createLogger, format, Logger, transports} from 'winston';

@bind({scope: BindingScope.SINGLETON})
export class MyWinstonLoggerProvider {
  private logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.json(),
      transports: [
        new transports.Console(),
        // Add other transports as needed
      ],
    });
  }

  value(): Logger {
    return this.logger;
  }
  log(message: string, level: string = 'info') {
    this.logger.log({
      level,
      message,
    });
  }

  // ...other logger methods (e.g., error, warn, etc.)
}


// 2. Variante
// import {Provider, inject} from '@loopback/core';
// import {LoggingBindings, WinstonLogger} from '@loopback/logging';

// export class MyWinstonLoggerProvider implements Provider<WinstonLogger> {
//   constructor(
//     @inject(LoggingBindings.WINSTON_LOGGER)
//     private winstonLogger: WinstonLogger,
//   ) { }

//   value(): WinstonLogger {
//     return this.winstonLogger;
//   }
// }


// 1. Variante
// import {Provider} from '@loopback/core';
// import {WinstonLogger} from '@loopback/logging';
// import winston from 'winston';

// export class MyWinstonLoggerProvider implements Provider<WinstonLogger> {
//   private loggerInstance: winston.Logger;

//   constructor() {
//     const customFormatter = winston.format.printf(({timestamp, level, message}) => {
//       const date = new Date(timestamp);
//       const day = String(date.getDate()).padStart(2, '0');
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const year = String(date.getFullYear()).slice(2);
//       const hours = String(date.getHours()).padStart(2, '0');
//       const minutes = String(date.getMinutes()).padStart(2, '0');
//       const seconds = String(date.getSeconds()).padStart(2, '0');
//       const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

//       return `${year}${month}${day} ${hours}:${minutes}:${seconds}.${milliseconds} ${level.padStart(8).toUpperCase()} ${message}`;
//     });

//     this.loggerInstance = winston.createLogger({
//       level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
//       defaultMeta: {Application: 'quote_api'},
//       transports: [
//         new winston.transports.Console({
//           format: winston.format.combine(
//             winston.format.timestamp(),
//             customFormatter
//           ),
//           level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
//         }),
//       ],
//     });
//   }

//   value(): winston.Logger {
//     return this.loggerInstance;
//   }

// }
