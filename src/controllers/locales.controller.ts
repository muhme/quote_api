import {api, operation} from '@loopback/rest';

/**
 * /locales controller
 */
@api({
  paths: {},
})
export class LocalesController {
  constructor() { }
  /**
   *
   *
   */
  @operation('get', '/locales', {
    tags: ['Locales'],
    responses: {
      '200': {
        description: 'The resource was successfully retrieved and is in the body of the message.',
      },
      '500': {
        description: 'Internal Server Error.',
      },
    },
    operationId: 'get-available-locales',
    summary: 'Get all available locales.',
  })
  async getAvailableLocales(): Promise<unknown> {
    /**
     * hard-wired, corresponding with Rails:
     * config.i18n.available_locales = [:de, :en, :es, :ja, :uk]
     */
    return ["de", "en", "es", "ja", "uk"];
  }
}
