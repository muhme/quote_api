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
        description: 'The available languages were successfully retrieved and returned as an array of two-character strings.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'string',
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
  async getAvailableLocales(): Promise<unknown> {
    /**
     * hard-wired, corresponding with Ruby on Rails:
     * config.i18n.available_locales = [:de, :en, :es, :ja, :uk]
     */
    return LOCALES;
  }
}
