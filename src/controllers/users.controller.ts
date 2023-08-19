import {repository} from '@loopback/repository';
import {api, operation, param} from '@loopback/rest';
import {User} from '../models/user.model';
import {UserFilter, UsersRepository} from '../repositories/users.repository';

/**
 * /users controller
 *
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
    operationId: 'get-users',
    summary: 'Get users login names and there IDs. Please note that only the login names of the users who created quotes are provided.'
  })
  async getUsers(
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
      description: 'The beginning of the login name to limit the list for type-ahead.',
      required: false,
      schema: {
        type: 'string'
      }
    })
    starting?: string,
  ): Promise<User[]> {
    const filter: UserFilter = {
      offset: (page - 1) * size,
      limit: size,
      starting: starting
    };

    return this.usersRepository.findUsersWithQuotations(filter);
  }
}
