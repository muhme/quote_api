// import {inject} from '@loopback/core';
// import {logInvocation} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {HttpErrors, api, get, param} from '@loopback/rest';
import {PARAM_MAX_LENGTH, PagingFilter, UsersPaged, validateOnlyLettersAndMaxLength, validatePageAndSize} from '../common';
// import {MyLogger} from '../providers';
// import {LoggingBindings, WinstonLogger} from '@loopback/logging';
import {UsersRepository} from '../repositories/users.repository';

const RESPONSES = {
  '200': {
    description: 'OK – the login names and there IDs retrieved successfully. The result is sorted by login names.',
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
            message: "No user entries found for the given parameters."
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
  @get('/users', {
    tags: ['Users'],
    responses: RESPONSES,
    operationId: 'get-users',
    summary: 'Get list of users login names and there IDs.',
    description: 'Get users login names and there IDs. Only users who have \
      created quotes and whose quotes are public are provided.'
  })
  // log method invocations
  // @logInvocation()
  async getUsers(
    @param.query.number('page', {
      description: "The response is made page by page, the optional parameter \
        'page' controls the page number of the result. Starting with page 1.",
      default: 1
    }) page = 1,
    @param.query.number('size', {
      description: "The response is made page by page, the optional parameter \
        'size' controls how many entries are returned on a page.",
      default: 100
    }) size = 100,
    @param.query.string('starting', {
      description: `The beginning of the login name to limit the list for \
      type-ahead. The parameter 'starting' may contain only up-to \
      ${PARAM_MAX_LENGTH} and cannot start with an apostrophe.`
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
