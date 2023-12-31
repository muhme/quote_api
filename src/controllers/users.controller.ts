// import {inject} from '@loopback/core';
import {logInvocation} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {HttpErrors, api, get, param} from '@loopback/rest';
import {PARAM_MAX_LENGTH, PagingFilter, UsersPaged, validateOnlyLettersAndMaxLength, validatePageAndSize} from '../common';
// import {MyLogger} from '../providers';
// import {LoggingBindings, WinstonLogger} from '@loopback/logging';
import {UsersRepository} from '../repositories/users.repository';

const RESPONSES = {
  '200': {
    description: 'OK – the login names and their IDs are retrieved successfully. The result is sorted by login names.',
    content: {
      'application/json': {
        example: {
          paging: {
            totalCount: 3,
            page: 1,
            size: 100,
            starting: "ch"
          },
          users: [
            {
              id: 85,
              "login": "charly"
            },
            {
              id: 74,
              login: "chiedelina"
            },
            {
              id: 100,
              login: "chris267"
            }
          ]
        }
      },
    },
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
            message: "No user entries found for the given parameters."
          }
        }
      },
      'text/html': {
        example: "<html> ... <h1>NotFoundError</h1> <h2><em>404</em> No user entries found for given parameters.</h2> ..."
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
 * /users controller - get list of users, which have created quotes
 */
@api({
  paths: {},
})
export class UsersController {

  // Inject a winston logger
  // @inject('logger') private logger: MyLogger;
  // @inject(LoggingBindings.WINSTON_LOGGER) private logger: WinstonLogger;

  constructor(
    @repository(UsersRepository)
    public usersRepository: UsersRepository
  ) { }
  // http access is logged by global interceptor
  @get('/v1/users', {
    tags: ['Users'],
    responses: RESPONSES,
    operationId: 'get-users',
    summary: 'Get list of users login names and their IDs.',
    description: 'Get users login names and their IDs. Only users who have \
      created quotes and whose quotes are public are provided.'
  })
  // log method invocations
  @logInvocation()
  async getUsers(
    @param.query.integer('page', {
      description: "The response is made page by page, the optional parameter \
        `page` controls the page number of the result. Starting with page 1.",
      schema: {
        type: 'integer',
        default: 1
      }
    }) page = 1,
    @param.query.integer('size', {
      description: "The response is made page by page, the optional parameter \
        `size` controls how many entries are returned on a page.",
      schema: {
        type: 'integer',
        default: 100
      }
    }) size = 100,
    @param.query.string('starting', {
      description: `The beginning of the login name to limit the list for \
      type-ahead. The parameter \`starting\` may contain only up-to \
      ${PARAM_MAX_LENGTH} characters and cannot start with an apostrophe.`
    }) starting?: string
  ): Promise<UsersPaged> {

    // prevent SQL injection on where like
    validateOnlyLettersAndMaxLength(starting, 'starting');

    // page and size >= 1?
    validatePageAndSize(page, size);

    const filter: PagingFilter = {page, size, starting};

    const usersPaged = await this.usersRepository.findUsersWithQuotations(filter);

    if (usersPaged.users.length === 0) {
      throw new HttpErrors.NotFound("No user entries found for given parameters.")
    }

    return usersPaged;
  }
}
