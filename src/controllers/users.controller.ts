import {repository} from '@loopback/repository';
import {HttpErrors, api, operation, param} from '@loopback/rest';
import {PagingFilter, UsersPaged} from '../common/types';
import {UsersRepository} from '../repositories/users.repository';
/**
 * /users controller - get list of users, which have created quotes
 */
@api({
  paths: {},
})
export class UsersController {
  constructor(
    @repository(UsersRepository)
    public usersRepository: UsersRepository
  ) { }
  @operation('get', '/users', {
    tags: ['Users'],
    responses: {
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
    },
    operationId: 'get-users',
    summary: 'Get list of users login names and there IDs.',
    description: 'Get users login names and there IDs. Only users who have \
      created quotes and whose quotes are public are provided.'
  })
  async getUsers(
    @param({
      name: 'page',
      in: 'query',
      description: 'The response is made page by page, the optional parameter \'page\' controls the page number of the result. Starting with page 1.',
      required: false,
      schema: {
        type: 'number',
        default: 1
      }
    }) page = 1,
    @param({
      name: 'size',
      in: 'query',
      description: 'The response is made page by page, the optional parameter \'size\' controls how many entries are returned on a page.',
      required: false,
      schema: {
        type: 'number',
        default: 100
      }
    }) size = 100,
    @param({
      name: 'starting',
      in: 'query',
      description: 'The beginning of the login name to limit the list for type-ahead.',
      required: false,
      schema: {
        type: 'string'
      }
    }) starting?: string,
  ): Promise<UsersPaged> {
    if (page < 1) {
      throw new HttpErrors.BadRequest("Parameter 'page' must be greater than 1.");
    }
    if (size < 1) {
      throw new HttpErrors.BadRequest("Parameter 'size' must be greater than 1.");
    }
    const filter: PagingFilter = {
      page: page,
      size: size,
      starting: starting
    };

    const usersPaged = await this.usersRepository.findUsersWithQuotations(filter);
    if (usersPaged.users.length === 0) {
      throw new HttpErrors.NotFound("No user entries found for given parameters.")
    }
    return usersPaged;
  }
}
