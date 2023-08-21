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
        description: 'OK – the authors retrieved successfully. The result is sorted by the (last) names of the authors.',
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
    operationId: 'get-authors',
    summary: 'Get authors with first name, (last) name, description and ID for given language. Only public authors are provided.'
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
      name: 'name',
      in: 'query',
      description: 'The beginning of the authors (last) name to limit the list for type-ahead.',
      required: false,
      schema: {
        type: 'string'
      }
    }) name?: string,
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
      name: 'nfd',
      in: 'query',
      description: 'The beginning of the authors "name, firstname, description" to limit the list for type-ahead. Parameters "name", "firstname" and "description" are ignored is parameter "nfd" is used.',
      required: false,
      schema: {
        type: 'string'
      }
    }) nfd?: string,
  ): Promise<AuthorsPaged> {
    const filter: AuthorsFilter = {
      language: language,
      page: page,
      size: size,
      name: name,
      firstname: firstname,
      description: description,
      nfd: nfd // "name, firstname, description"
    };

    return this.authorsRepository.findAuthors(filter);
  }

  @operation('get', '/author', {
    tags: ['Authors'],
    responses: {
      '200': {
        description: 'OK – the author retrieved successfully.',
      },
      '400': {
        description: 'Bad Request – request format or parameters are invalid.',
      },
      '404': {
        description: 'Not Found – no author entry found for given ID.',
      },
      '500': {
        description: 'Internal Server Error.',
      },
    },
    operationId: 'get-authors',
    summary: 'Get one author entry for ID in given language. Requested author entry have to be public.'
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

    const result = await this.authorsRepository.findAuthor(filter);

    // console.log(JSON.stringify(result, null, 2));;
    if (!result.length) {
      throw new HttpErrors.NotFound(`No author entry found for ID #${filter.id}!`);
    }

    return result;
  }
}
