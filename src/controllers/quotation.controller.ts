import {inject} from '@loopback/core';
import {LoggingBindings, WinstonLogger, logInvocation} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {HttpErrors, api, get, param} from '@loopback/rest';
import {QuoteFilter, RandomQuote, ZITAT_SERVICE_DE, checkAndSetLanguage} from '../common';
import {Author} from '../models';
import {Quotation} from '../models/quotation.model';
import {CategoriesRepository, UsersRepository} from '../repositories';
import {AuthorsRepository} from '../repositories/authors.repository';
import {QuotationRepository} from '../repositories/quotation.repository';

const RESPONSES = {
  '200': {
    description: "OK – a random quote retrieved successfully. \
      Always returned are the attributes 'quote', 'link' and 'authorId'. \
      If they exist, the optional attributes 'authorName', 'authorLink', \
      'source', and 'sourceLink' will be returned. If the author is \
      unknown or not applicable, the 'authorId' attribute is 0.",
    content: {
      'application/json': {
        example: {
          quote: "We always overestimate the change that will occur in the next two years and underestimate the change that will occur in the next ten.",
          link: "https://www.zitat-service.de/en/quotations/1337",
          source: "The Road Ahead, Afterword, p. 316, 2006",
          authorId: 286,
          authorName: "Bill Gates",
          authorLink: "https://en.wikipedia.org/wiki/Bill_Gates"
        }
      }
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
            message: "Parameter 'userId' must be a positive number."
          }
        }
      },
    }
  },
  '404': {
    description: 'Not Found – no random quote found for the given parameters.',
    content: {
      'application/json': {
        example: {
          error: {
            statusCode: 404,
            name: "NotFoundError",
            message: "No quote found for given parameters: language=es, userId=42 (rezitant), categoryId=42 (Carpintero), authorId=42 (Jean Paul)!"
          }
        }
      }
    },
  },
  '500': {
    description: 'Internal Server Error.',
  },
};

/**
 * /quotation controller - get one random quote
 */
@api({
  paths: {},
})
export class QuotationController {

  // Inject a winston logger
  @inject(LoggingBindings.WINSTON_LOGGER)
  private logger: WinstonLogger;

  constructor(
    @repository(QuotationRepository)
    public quotationRepository: QuotationRepository,
    @repository(AuthorsRepository)
    public authorsRepository: AuthorsRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(CategoriesRepository)
    public categoriesRepository: CategoriesRepository
  ) { }

  // http access is logged by global interceptor
  @get('/quote', {
    tags: ['Random Quote'],
    responses: RESPONSES,
    operationId: 'get-quotation',
    summary: "Get one random quote with source, author and links.",
    description: "Get one random quote with source, author and links. Can be \
      requested for 'language', 'authorId', 'categoryId' or 'userId'. \
      Only public quotes are provided. \
      Multiple parameters can be combinded e.g. \
      'language=de&authorId=46&categoryId=17' for German (de) quotes \
      only from author Laozi (#46) and category Learning (#17)."
  })
  // log method invocations
  @logInvocation()
  async getQuotations(
    @param.query.string('language', {
      description: "The language for the random quote. See /languages for available languages. If the parameter language is missing, it defaults to 'en' (English).",
      default: 'en'
    }) language = 'en',

    @param.query.number('userId', {
      description: "Restrict to pick-up quotes only from given 'userId'. See /users for available user entries."
    }) userId?: number,

    @param.query.number('authorId', {
      description: "Restrict to pick-up quotes only from given 'authorId'. See /authors for available author entries."
    }) authorId?: number,

    @param.query.number('categoryId', {
      description: "Restrict to pick-up quotes only from given 'categoryId'. See /categories for available category entries."
    }) categoryId?: number
  ): Promise<RandomQuote> {

    this.validateParameters(userId, authorId, categoryId);

    const filter: QuoteFilter = {language: checkAndSetLanguage(language), userId, authorId, categoryId};

    const quote = await this.quotationRepository.findQuotation(filter);

    if (!quote.length) {
      await this.throwNotFoundWithGivenParametes(filter);
    }
    if (!quote || quote.length !== 1) {
      throw new HttpErrors.NotFound(`Could not find a quote for given parameters.`);
    }

    return this.mapQuoteToRandomQuote(quote[0], language);
  }

  private async mapQuoteToRandomQuote(quote: Quotation, language: string): Promise<RandomQuote> {

    const randomQuote: RandomQuote = {
      quote: quote.quotation,
      link: ZITAT_SERVICE_DE + `/${language}/quotations/${quote.id}`,
      source: quote.source === null ? undefined : quote.source,
      sourceLink: quote.sourceLink === null ? undefined : quote.sourceLink,
      authorId: quote.authorId
    };

    const author: (Author | undefined) = await this.authorsRepository.findAuthor({language: language, id: quote.authorId ?? 0}); // using author ID 0 'unknown' in case of problems

    if (author) {
      randomQuote.authorName = author.name;
      randomQuote.authorLink = author.link;
    }

    return randomQuote;
  }

  private validateParameters(userId?: number, authorId?: number, categoryId?: number): void {
    if (userId && userId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'userId' must be a positive number.");
    }
    if (authorId && authorId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'authorId' must be a positive number.");
    }
    if (categoryId && categoryId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'categoryId' must be a positive number.");
    }
  }

  // create descriptive error message with all parameters set and throw 404
  private async throwNotFoundWithGivenParametes(filter: QuoteFilter) {

    let givenParams = `language=${filter.language}`;
    if (filter.userId !== undefined) {
      const loginName = await this.usersRepository.loginName(filter.userId);
      givenParams += `, userId=${filter.userId} (${loginName})`
    }
    if (filter.categoryId !== undefined) {
      const categoryName = await this.categoriesRepository.categoryName(filter.categoryId, filter.language);
      givenParams += `, categoryId=${filter.categoryId} (${categoryName})`
    }
    if (filter.authorId !== undefined) {
      const authorName = await this.authorsRepository.authorName(filter.authorId, filter.language);
      givenParams += `, authorId=${filter.authorId} (${authorName})`
    }
    throw new HttpErrors.NotFound(`No quote found for given parameters: ${givenParams}!`);
  }

}
