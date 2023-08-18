import {repository} from '@loopback/repository';
import {api, operation, param} from '@loopback/rest';
import {Category} from '../models/category.model';
import {CategoriesRepository, CategoryFilter} from '../repositories/categories.repository';

/**
 * /categories controller
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
    responses: {
      '200': {
        description: 'OK – the category names and there IDs retrieved successfully. The result is sorted by category names.',
      },
      '400': {
        description: 'Bad Request – request format or parameters are invalid.',
      },
      '404': {
        description: 'Not Found – no entries found for the given parameters.',
      },
      '500': {
        description: 'Internal Server Error.',
      },
    },
    operationId: 'get-categories',
    summary: 'Get category names and there IDs for given locale.'
  })
  async getCategories(
    @param({
      name: 'locale',
      in: 'query',
      description: 'The locale for the category names. See /locales for available languages.',
      required: false,
      schema: {
        type: 'string',
        default: 'en'
      }
    })
    locale = 'en',
    @param({
      name: 'page',
      in: 'query',
      description: 'The response is made page by page, this parameter controls the page number of the result. Starting with page 1.',
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
      description: 'The response is made page by page, this parameter controls how many entries are returned on a page.',
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
  ): Promise<Category[]> {
    const filter: CategoryFilter = {
      locale: locale,
      offset: (page - 1) * size,
      limit: size,
      starting: starting
    };

    return this.categoriesRepository.findCategories(filter);
  }
}
