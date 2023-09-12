import {logInvocation} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {HttpErrors, api, get, param} from '@loopback/rest';
import {CategoriesPaged, PARAM_MAX_LENGTH, PagingLanguageFilter, checkAndSetLanguage, myStringify, validateOnlyLettersAndMaxLength, validatePageAndSize} from '../common';
//import {MyLogger} from '../providers';
// import {LoggingBindings, WinstonLogger} from '@loopback/logging';
import {CategoriesRepository} from '../repositories/categories.repository';

const RESPONSES = {
  '200': {
    description: 'OK – the category names and there IDs retrieved \
      successfully. Object \'paging\' contains the two-letter \'language\' \
      code, the \'totalCount\' as number of all entries, the requested \
      \'page\' number and the requested number of entries with \'size\'. \
      The \'categories\' result array gives the unique \'id\' for each \
      entry and is sorted by \'category\' names.',
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
            name: "NotFoundError",
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
};

/**
 * /categories controller – gets a list of public categories
 *
 */
@api({
  paths: {},
})
export class CategoriesController {

  // Inject a winston logger
  // Inject a winston logger
  // @inject(LoggingBindings.WINSTON_LOGGER) private logger: WinstonLogger;
  // @inject('logger') private logger: MyLogger;

  constructor(
    @repository(CategoriesRepository)
    public categoriesRepository: CategoriesRepository
  ) { }

  // http access is logged by global interceptor
  @get('/categories', {
    tags: ['Categories'],
    responses: RESPONSES,
    operationId: 'get-categories',
    summary: 'Get list of category names with IDs.',
    description: "Get paged list of categories. List can be restricted with \
      parameter 'starting'. Category names are in the requested 'language'. \
      Only public categories are provided."
  })
  // log method invocations
  @logInvocation()
  async getCategories(
    @param.query.string('language', {
      description: 'The language for the author entries. See /languages for available languages.',
      default: 'en'
    }) language = 'en',

    @param.query.number('page', {
      description: 'The response is made page by page, this parameter controls the page number of the result. Starting with page 1.',
      default: 1
    }) page = 1,

    @param.query.number('size', {
      description: 'The response is made page by page, this parameter controls how many entries are returned on a page.',
      default: 100
    }) size = 100,

    @param.query.string('starting', {
      description: `Use the \'starting\' parameter to specify the beginning of \
        the category name to limit the list for preselection. The parameter \
        'starting' may contain only up-to ${PARAM_MAX_LENGTH} letters or spaces.`,
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
