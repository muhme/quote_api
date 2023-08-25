import {repository} from '@loopback/repository';
import {HttpErrors, api, operation, param} from '@loopback/rest';
import {AuthorFilter, AuthorsFilter, AuthorsPaged} from '../common/types';
import {Author} from '../models/author.model';
import {AuthorsRepository} from '../repositories/authors.repository';

/**
 * /authors controller – gets a list of authors
 *
 */
@api({
  paths: {},
})
export class AuthorsController {
  constructor(
    @repository(AuthorsRepository)
    public authorsRepository: AuthorsRepository
  ) { }
  @operation('get', '/authors', {
    tags: ['Authors'],
    responses: {
      '200': {
        description: 'OK – the authors retrieved successfully. \
          Object \'paging\' contains the two-letter \'language\' code, \
          the \'totalCount\' as number of all entries, the requested \'page\' \
          number and the requested number of entries with \'size\'. \
          If the result is using preselection with \'firstnam\', \'name\' or \
          \'description\' the values are shown. The \'authors\' result array \
          is sorted by the the authors \'lastname\'. Attributes \'id\' and \
          \'name\' are always present. Other only if the contain values.',
        content: {
          'application/json': {
            example: {
              paging: {
                language: "en",
                totalCount: 1,
                page: 1,
                size: 100,
                lastname: "A",
                firstname: "W"
              },
              authors: [
                {
                  id: 140,
                  lastname: "Allen",
                  firstname: "Woody",
                  description: "US-American director, actor, comedian, writer and musician (born 1935)",
                  link: "https://en.wikipedia.org/wiki/Woody_Allen",
                  name: "Woody Allen"
                },
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
                message: "Parameter 'id' must be a positive number."
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
                message: "No authors found for the ID #42."
              }
            }
          },
        }
      },
      '500': {
        description: 'Internal Server Error.',
      },
    },
    operationId: 'get-authors',
    summary: 'Get list of authors.',
    description: "Get paged list of authors. Can be restricted with \
      'lastname', 'firstname' and 'description'. These tree parameters can be \
      combined as parameter 'lfd'. Returned 'paging' contains \
      used 'language', total number of author entries found with parameter 'totalCount', \
      the requested page number with parameter 'page', the maximal number of \
      page entries with parameter 'size'. If the list is restricted the \
      'paing' parameters 'firstname', 'lastname' or 'description' are returned. \
      The 'authors' array contains entries with always existing attributes \
      'id' and 'name'. If they exist, the optional attributes 'firstname', \
      'lastname', 'link' and 'description' will be returned. All attributes \
      are given in the requested 'language'. Only public authors are provided."
  })
  async getAuthors(
    @param({
      name: 'language',
      in: 'query',
      description: 'The language for the author entries. See /languages for available languages.',
      required: false,
      schema: {
        type: 'string',
        default: 'en'
      }
    }) language = 'en',
    @param({
      name: 'page',
      in: 'query',
      description: 'The response is made page by page, this parameter controls the page number of the result. Starting with page 1.',
      required: false,
      schema: {
        type: 'number',
        default: 1
      }
    }) page = 1,
    @param({
      name: 'size',
      in: 'query',
      description: 'The response is made page by page, this parameter controls how many entries are returned on a page.',
      required: false,
      schema: {
        type: 'number',
        default: 100
      }
    }) size = 100,
    @param({
      name: 'lastname',
      in: 'query',
      description: 'The beginning of the authors last name to limit the list for type-ahead.',
      required: false,
      schema: {
        type: 'string'
      }
    }) lastname?: string,
    @param({
      name: 'firstname',
      in: 'query',
      description: 'The beginning of the authors first name to limit the list for type-ahead.',
      required: false,
      schema: {
        type: 'string'
      }
    }) firstname?: string,
    @param({
      name: 'description',
      in: 'query',
      description: 'The beginning of the authors description to limit the list for type-ahead.',
      required: false,
      schema: {
        type: 'string'
      }
    }) description?: string,
    @param({
      name: 'lfd',
      in: 'query',
      description: 'The beginning of the authors \
        "lastname, firstname, description" to limit the list for type-ahead. \
        Parameters \'lastname\', \'firstname\' and \'description\' are ignored \
        if parameter \lfd\' is used.',
      required: false,
      schema: {
        type: 'string'
      }
    }) lfd?: string,
  ): Promise<AuthorsPaged> {
    const filter: AuthorsFilter = {
      language: language,
      page: page,
      size: size,
      lastname: lastname,
      firstname: firstname,
      description: description,
      lfd: lfd // "lastname, firstname, description"
    };

    const authorsPaged = await this.authorsRepository.findAuthors(filter);

    if (authorsPaged.authors.length === 0) {
      throw new HttpErrors.NotFound("No authors found for given parameters.")
    }

    return authorsPaged;
  }

  @operation('get', '/author', {
    tags: ['Authors'],
    responses: {
      '200': {
        description: 'OK – the author retrieved successfully.',
        content: {
          'application/json': {
            example: {
              author: [
                {
                  id: 597,
                  lastname: "坂本",
                  firstname: "龍一",
                  description: "日本の作曲家、ピアニスト、プロデューサー、俳優、モデル（1952年～2023年）",
                  link: "https://ja.wikipedia.org/wiki/坂本龍一",
                  name: "坂本・龍一"
                },
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
        description: 'Not Found – no author entry found for given ID.',
        content: {
          'application/json': {
            example: {
              error: {
                statusCode: 404,
                name: "NotFoundError",
                message: "No authors found for the given parameters."
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
    operationId: 'get-authors',
    summary: 'Get one author entry for ID.',
    description: "Get one author entry for given 'id' in given 'language'. \
      Always returing attributes 'id' and 'name'. If they exist, the optional attributes 'firstname', \
      'lastname', 'link' and 'description' will be returned. All attributes \
      are given in the requested 'language'. \
      Requested author entry have to be public."
  })
  async getAuthor(
    @param({
      name: 'language',
      in: 'query',
      description: 'The language for the author entry. See /languages for available languages.',
      required: false,
      schema: {
        type: 'string',
        default: 'en'
      }
    }) language = 'en',
    @param({
      name: 'id',
      in: 'query',
      description: 'Authors ID. For a list of all author entries with their IDs see /authors',
      required: false,
      schema: {
        type: 'number',
        default: 1
      }
    }) id = 1,
  ): Promise<Author[] | null> {
    const filter: AuthorFilter = {
      language: language,
      id: id,
    };
    if (id < 0) {
      throw new HttpErrors.BadRequest("Parameter 'id' must be a positive number.");
    }
    const result = await this.authorsRepository.findAuthor(filter);

    // console.log(JSON.stringify(result, null, 2));;
    if (!result.length) {
      throw new HttpErrors.NotFound(`No author entry found for ID #${filter.id}!`);
    }

    return result;
  }
}
