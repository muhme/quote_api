import {inject} from '@loopback/core';
import {logInvocation} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {HttpErrors, api, get, param} from '@loopback/rest';
import {AuthorFilter, AuthorReturned, AuthorsFilter, AuthorsPaged, PARAM_MAX_LENGTH, checkAndSetLanguage, myStringify, validateOnlyLettersAndMaxLength, validatePageAndSize} from '../common';
import {Author} from '../models';
import {MyLogger} from '../providers';
import {AuthorsRepository} from '../repositories/authors.repository';

const AUTHORS_RESPONSES = {
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
            message: "No authors found for given parameters (language: 'en', page: 1, size: 100, lastname: 'XXX')."
          }
        }
      },
    }
  },
  '500': {
    description: 'Internal Server Error.',
  },
};

const AUTHOR_RESPONSES = {
  '200': {
    description: "OK – the author retrieved successfully. \
      Always present are the attributes 'id' and 'name'. The attributes \
      'firstname', 'lastname', 'description' and 'link' are only present \
      if they are exist. All attributes are returned in the requested \
      'language'.",
    content: {
      'application/json': {
        example: {
          author: {
            id: 597,
            lastname: "坂本",
            firstname: "龍一",
            description: "日本の作曲家、ピアニスト、プロデューサー、俳優、モデル（1952年～2023年）",
            link: "https://ja.wikipedia.org/wiki/坂本龍一",
            name: "坂本・龍一"
          }
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
};

/**
 * /authors controller – gets a paged list of authors
 *
 */
@api({
  paths: {},
})
export class AuthorsController {

  // Inject a winston logger
  // @inject(LoggingBindings.WINSTON_LOGGER)
  // private logger: WinstonLogger;
  @inject('logger') private logger: MyLogger;

  constructor(
    @repository(AuthorsRepository)
    public authorsRepository: AuthorsRepository
  ) { }
  // http access is logged by global interceptor
  @get('/authors', {
    tags: ['Authors'],
    responses: AUTHORS_RESPONSES,
    operationId: 'get-authors',
    summary: 'Get list of authors and there IDs.',
    description: "Get paged list of authors. List can be restricted with \
      'lastname', 'firstname' and 'description'. These tree parameters can be \
      combined as one comma-separated parameter 'lfd'. Returned 'paging' contains \
      used 'language', total number of author entries found with parameter 'totalCount', \
      the requested page number with parameter 'page', the maximal number of \
      page entries with parameter 'size'. If the list is restricted the \
      'paging' parameters 'firstname', 'lastname' or 'description' are returned. \
      The entries of the 'authors' array always contain the attributes 'id' \
      and 'name'. If they exist, the optional attributes 'firstname', \
      'lastname', 'link' and 'description' will be returned. All attributes \
      are given in the requested 'language'. Only public authors are provided."
  })
  // log method invocations
  @logInvocation()
  async getAuthors(
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

    @param.query.string('lastname', {
      description: `The beginning of the authors last name to limit the list \
        for type-ahead. The parameter 'lastname' may contain only up-to \
        ${PARAM_MAX_LENGTH} letters or spaces.`
    }) lastname?: string,

    @param.query.string('firstname', {
      description: `The beginning of the authors first name to limit the list \
        for type-ahead. The parameter 'lastname' may contain only up-to \
        ${PARAM_MAX_LENGTH} letters or spaces.`
    }) firstname?: string,

    @param.query.string('description', {
      description: `The beginning of the authors description to limit the list \
      for type-ahead. The parameter 'lastname' may contain only up-to \
      ${PARAM_MAX_LENGTH} letters or spaces.`
    }) description?: string,

    @param.query.string('lfd', {
      description: "The beginning of the authors 'lastname,firstname,description' to limit the list for type-ahead. Parameters 'lastname', 'firstname' and 'description' are ignored if parameter 'lfd' is used."
    }) lfd?: string
  ): Promise<AuthorsPaged> {

    this.logger.log('debug', '@get/authors');

    const filter: AuthorsFilter = {
      language: checkAndSetLanguage(language),
      page: page,
      size: size,
      lastname: lastname,
      firstname: firstname,
      description: description,
      lfd: lfd // "lastname,firstname,description"
    };

    // nfd used with "name, firstname, description"?
    if (filter.lfd) {
      [filter.lastname, filter.firstname, filter.description] = filter.lfd.split(",", 3);
      delete filter.lfd;
    }

    // prevent SQL injection on where like
    validateOnlyLettersAndMaxLength(filter.lastname, 'lastname');
    validateOnlyLettersAndMaxLength(filter.firstname, 'firstname');
    validateOnlyLettersAndMaxLength(filter.description, 'description');

    // page and size >= 1?
    validatePageAndSize(page, size);

    const authorsPaged = await this.authorsRepository.findAuthors(filter);

    if (authorsPaged.authors.length === 0) {
      throw new HttpErrors.NotFound(`No authors found for given parameters (${myStringify(filter)}).`)
    }

    return authorsPaged;
  }

  // http access is logged by global interceptor
  @get('/author', {
    tags: ['Authors'],
    responses: AUTHOR_RESPONSES,
    operationId: 'get-authors',
    summary: 'Get one author entry by ID.',
    description: "Get one author entry for given 'id' in given 'language'. \
      Always returned attributes are 'id' and 'name'. If they exist, the optional attributes 'firstname', \
      'lastname', 'link' and 'description' will be returned. All attributes \
      are given in the requested 'language'. \
      Requested author entry have to be public."
  })
  // log method invocations
  @logInvocation()
  async getAuthor(
    @param.query.string('language', {
      description: 'The language for the author entry. See /languages for available languages.',
      default: 'en'
    }) language = 'en',

    @param.query.number('id', {
      description: 'Authors ID. For a list of all author entries with their IDs see /authors',
      default: 1
    }) id = 1
  ): Promise<AuthorReturned | null> {
    const filter: AuthorFilter = {
      language: checkAndSetLanguage(language),
      id: id,
    };
    if (id < 0) {
      throw new HttpErrors.BadRequest("Parameter 'id' must be a positive number.");
    }
    const author: (Author | undefined) = await this.authorsRepository.findAuthor(filter);

    if (!author) {
      throw new HttpErrors.NotFound(`No author entry found for ID #${filter.id}!`);
    }

    return {author: author};
  }
}
