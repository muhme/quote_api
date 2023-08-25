import {api, operation} from '@loopback/rest';
import {LOCALES} from '../common/constants';

/**
 * /locales controller - get available locales
 */
@api({
  paths: {},
})
export class LocalesController {
  constructor() { }
  @operation('get', '/languages', {
    tags: ['Languages'],
    responses: {
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
    },
    operationId: 'get-available-languages',
    summary: 'Get all available languages.',
  })
  async getAvailableLocales(): Promise<string[]> {
    /**
     * hard-wired, corresponding with Ruby on Rails:
     * config.i18n.available_locales = [:de, :en, :es, :ja, :uk]
     */
    return LOCALES;
  }
}
