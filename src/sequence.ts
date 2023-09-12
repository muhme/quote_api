import {MiddlewareSequence, RequestContext} from '@loopback/rest';
import {LoggerProvider} from './providers';

export class MySequence extends MiddlewareSequence {

  async handle(context: RequestContext) {
    // set requestId as milliseconds since 1970
    context.bind('requestId').to(Date.now().toString());

    context.bind('logger').toProvider(LoggerProvider);

    // now, call the superclass handle method
    await super.handle(context);
  }
}
