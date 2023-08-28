import {inject} from '@loopback/core';
import {LoggingBindings, WinstonLogger, logInvocation} from '@loopback/logging';
import {api, get} from '@loopback/rest';
import {LOCALES} from '../common';

const RESPONSES = {
  '200': {
    description: 'OK – available languages were successfully retrieved and returned as an array of two-letter ISO 639-1 language codes.',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'string',
            description: 'two-letter ISO 639-1 language code'
          },
        },
        example: LOCALES,
      },
    },
  },
  '500': {
    description: 'Internal Server Error.',
    content: {
      'application/json': {
        example: {
          error: {
            statusCode: 500,
            message: "Internal Server Error"
          }
        }
      },
    },
  },
};

/**
 * /languages controller - get available languages
 */
@api({
  paths: {},
})
export class LanguagesController {

  // Inject a winston logger
  @inject(LoggingBindings.WINSTON_LOGGER)
  private logger: WinstonLogger;

  constructor() { }
  // http access is logged by global interceptor
  @get('/languages', {
    tags: ['Languages'],
    responses: RESPONSES,
    operationId: 'get-available-languages',
    summary: 'Get list of all available language codes.',
    description: `Get a list of all available languages for all the content \
      (quotes, author names, category names and links) as string-array of \
      two-letter ISO 639-1 codes. At the moment these are ${LOCALES}.`,
  })
  // log method invocations
  @logInvocation()
  async getAvailableLanguages(): Promise<string[]> {
    /**
     * hard-wired, corresponding with Ruby on Rails:
     * config.i18n.available_locales = [:de, :en, :es, :ja, :uk]
     */
    return LOCALES;
  }
}
