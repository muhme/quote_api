import {repository} from '@loopback/repository';
import {HttpErrors, api, operation, param} from '@loopback/rest';
import {setDefaultLocale} from '../common/helpers';
import {CategoriesPaged, PagingLocaleFilter} from '../common/types';
import {CategoriesRepository} from '../repositories/categories.repository';
/**
 * /categories controller – gets a list of public categories
 *
 */
@api({
  paths: {},
})
export class CategoriesController {
  constructor(
    @repository(CategoriesRepository)
    public categoriesRepository: CategoriesRepository
  ) { }
  @operation('get', '/categories', {
    tags: ['Categories'],
    responses: {
      '200': {
        description: 'OK – the category names and there IDs retrieved successfully. The result is sorted by category names.',
        content: {
          'application/json': {
            example: {
              paging: {
                language: "en",
                totalCount: 3,
                page: 1,
                size: 3,
                starting: "D"
              },
              categories: [
                {
                  id: 569,
                  "category": "dance"
                },
                {
                  id: 74,
                  category: "Darkness"
                },
                {
                  id: 100,
                  category: "Day"
                }
              ]
            }
          },
        }
      },
      '400': {
        description: 'Bad Request – request format or parameters are invalid.',
        content: {
          'application/json': {
            example: {
              error: {
                statusCode: 400,
                message: "Parameter 'page' must be greater than 1."
              }
            }
          },
        }
      },
      '404': {
        description: 'Not Found – no entries found for the given parameters.',
        content: {
          'application/json': {
            example: {
              error: {
                statusCode: 404,
                message: "No categories found for the given parameters."
              }
            }
          },
        }
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
    operationId: 'get-categories',
    summary: 'Get category names and there IDs for given language. Only public categories are provided.'
  })
  async getCategories(
    @param({
      name: 'language',
      in: 'query',
      description: 'The language for the category names. See /languages for available languages. If the language is not recognized, it defaults to \'en\' (English).',
      required: false,
      schema: {
        type: 'string',
        default: 'en'
      }
    })
    language = 'en',
    @param({
      name: 'page',
      in: 'query',
      description: 'The response is made page by page, the parameter \'page\' controls the page number of the result. Starting with page 1.',
      required: false,
      schema: {
        type: 'number',
        default: 1
      }
    })
    page = 1,
    @param({
      name: 'size',
      in: 'query',
      description: 'The response is made page by page, the parameter \'size\' controls how many entries are returned on a page.',
      required: false,
      schema: {
        type: 'number',
        default: 100
      }
    })
    size = 100,
    @param({
      name: 'starting',
      in: 'query',
      description: 'The beginning of the category name to limit the list for type-ahead.',
      required: false,
      schema: {
        type: 'string'
      }
    })
    starting?: string,
  ): Promise<CategoriesPaged> {
    if (page < 1) {
      throw new HttpErrors.BadRequest("Parameter 'page' must be greater than 1.");
    }
    if (size < 1) {
      throw new HttpErrors.BadRequest("Parameter 'size' must be greater than 1.");
    }
    const filter: PagingLocaleFilter = {
      language: setDefaultLocale(language),
      page: page,
      size: size,
      starting: starting
    };

    const categoriesPaged = await this.categoriesRepository.findCategories(filter);
    if (categoriesPaged.categories.length === 0) {
      throw new HttpErrors.NotFound("No categories found for given parameters.")
    }
    return categoriesPaged;
  }
}
