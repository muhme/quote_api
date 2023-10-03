import {logInvocation} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {api, get, HttpErrors, param} from '@loopback/rest';
import {CategoriesPaged, checkAndSetLanguage, myStringify, PagingLanguageFilter, PARAM_MAX_LENGTH, validateOnlyLettersAndMaxLength, validatePageAndSize} from '../common';
import {CategoriesRepository} from '../repositories/categories.repository';

const RESPONSES = {
  '200': {
    description: 'OK – the category names and their IDs retrieved \
      successfully. Object `paging` contains the two-letter `language` \
      code, the `totalCount` as number of all entries, the requested \
      `page` number and the requested number of entries with `size`. \
      The `categories` result array gives the unique `id` for each \
      entry and is sorted by `category` names.',
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
            name: "BadRequestError",
            message: "Parameter 'page' must be greater than or equal to 1."
          }
        }
      },
      'text/html': {
        example: "<html> ... <h1>BadRequestError</h1> <h2><em>400</em> Parameter &#39;page&#39; must be greater than or equal to 1.</h2> ..."
      }
    }
  },
  '404': {
    description: 'Not Found – no entries found for the given parameters.',
    content: {
      'application/json': {
        example: {
          error: {
            statusCode: 404,
            name: "NotFoundError",
            message: "No categories found for given parameters: language: 'en', page: '1', size: '100', starting: 'XXX'"
          }
        }
      },
      'text/html': {
        example: "<html> ... <h1>NotFoundError</h1> <h2><em>404</em> No categories found for given parameters: language: &#39;en&#39;, page: &#39;1&#39;, size: &#39;100&#39;, starting: &#39;XXX&#39;</h2> ..."
      }
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
      'text/html': {
        example: '<html> ... <h2><em>500</em> Internal Server Error</h2> ... </html>'
      }
    },
  },
  '503': {
    description: 'Service Unavailable (e.g. Node.js does not run behind the Apache web server).',
  },
};

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

  // http access is logged by global interceptor
  @get('/v1/categories', {
    tags: ['Categories'],
    responses: RESPONSES,
    operationId: 'get-categories',
    summary: 'Get list of category names with their IDs.',
    description: "Get paged list of categories. List can be restricted with \
      parameter `starting`. Category names are in the requested `language`. \
      Only public categories are used."
  })
  // log method invocation
  @logInvocation()
  async getCategories(
    @param.query.string('language', {
      description: 'The language for the category entries. See `/v1/languages` for available languages.',
      default: 'en'
    }) language = 'en',

    @param.query.integer('page', {
      description: 'The response is made page by page, the parameter `page` controls the page number of the result. Starting with page 1.',
      default: 1
    }) page = 1,

    @param.query.integer('size', {
      description: 'The response is made page by page, the parameter `size` controls how many entries are returned on a page.',
      default: 100
    }) size = 100,

    @param.query.string('starting', {
      description: `Use the \`starting\` parameter to specify the beginning of \
        the category name to limit the list for preselection. The parameter \
        \`starting\` may contain only up-to ${PARAM_MAX_LENGTH} letters or spaces.`,
    }) starting?: string
  ): Promise<CategoriesPaged> {

    // prevent SQL injection on where like
    validateOnlyLettersAndMaxLength(starting, 'starting');

    // page and size >= 1?
    validatePageAndSize(page, size);

    const filter: PagingLanguageFilter = {
      language: checkAndSetLanguage(language),
      page: page,
      size: size,
      starting: starting
    };

    const categoriesPaged = await this.categoriesRepository.findCategories(filter);

    if (categoriesPaged.categories.length === 0) {
      throw new HttpErrors.NotFound(`No categories found for given parameters: ${myStringify(filter)}`)
    }

    return categoriesPaged;
  }
}
