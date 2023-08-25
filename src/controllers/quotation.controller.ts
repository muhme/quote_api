import {inject} from '@loopback/core';
import {LoggingBindings, WinstonLogger, logInvocation} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {HttpErrors, api, operation, param} from '@loopback/rest';
import {setDefaultLocale} from '../common/helpers';
import {QuoteFilter, RandomQuote} from '../common/types';
import {Author} from '../models';
import {Quotation} from '../models/quotation.model';
import {CategoriesRepository, UsersRepository} from '../repositories';
import {AuthorsRepository} from '../repositories/authors.repository';
import {QuotationRepository} from '../repositories/quotation.repository';

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

  @logInvocation()
  @operation('get', '/quote', {
    tags: ['Random Quote'],
    responses: {
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
    },
    operationId: 'get-quotation',
    summary: "Get one random quote with source, author and links.",
    description: "Get one random quote with source, author and links. Can be \
      requested for 'language', 'authorId', 'categoryId' or 'userId'. \
      Only public quotes are provided. \
      Multiple parameters can be combinded e.g. \
      'language=de&authorId=46&categoryId=17' for German (de) quotes \
      only from author Laozi (#46) and category Learning (#17)."
  })
  async getQuotations(
    @param({
      name: 'language',
      in: 'query',
      description: "The language for the random quote. See /languages for \
        available languages. If the language code is not known, it defaults \
        to 'en' (English).",
      required: false,
      schema: {
        type: 'string',
        default: 'en'
      }
    }) language = 'en',
    @param({
      name: 'userId',
      in: 'query',
      description: "Restrict to pick-up quotes only from given 'userId'. \
        See /users for available user entries.",
      required: false,
      schema: {
        type: 'number'
      }
    }) userId?: number,
    @param({
      name: 'authorId',
      in: 'query',
      description: "Restrict to pick-up quotes only from given 'authorId'. \
        See /authors for available author entries.",
      required: false,
      schema: {
        type: 'number'
      }
    }) authorId?: number,
    @param({
      name: 'categoryId',
      in: 'query',
      description: "Restrict to pick-up quotes only from given 'categoryId'. \
        See /categories for available categegory entries.",
      required: false,
      schema: {
        type: 'number'
      }
    }) categoryId?: number,
  ): Promise<RandomQuote[]> {

    if (userId && userId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'userId' must be a positive number.");
    }
    if (authorId && authorId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'authorId' must be a positive number.");
    }
    if (categoryId && categoryId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'categoryId' must be a positive number.");
    }

    const filter: QuoteFilter = {
      language: setDefaultLocale(language),
      userId: userId,
      authorId: authorId,
      categoryId: categoryId
    };

    const quote = await this.quotationRepository.findQuotation(filter);

    if (!quote.length) {
      // create descriptive error message with all parameters set
      let givenParams = `language=${language}`;
      if (userId !== undefined) {
        const loginName = await this.usersRepository.loginName(userId);
        givenParams += `, userId=${userId} (${loginName})`
      }
      if (categoryId !== undefined) {
        const categoryName = await this.categoriesRepository.categoryName(categoryId, language);
        givenParams += `, categoryId=${categoryId} (${categoryName})`
      }
      if (authorId !== undefined) {
        const authorName = await this.authorsRepository.authorName(authorId, language);
        givenParams += `, authorId=${authorId} (${authorName})`
      }
      throw new HttpErrors.NotFound(`No quote found for given parameters: ${givenParams}!`);
    }

    if (!quote || quote.length !== 1) {
      throw new HttpErrors.NotFound(`Could not find a quote for given parameters!`);
    }

    return [await this.mapQuoteToRandomQuote(quote[0], language)];
  }

  async mapQuoteToRandomQuote(quote: Quotation, language: string): Promise<RandomQuote> {

    const randomQuote: RandomQuote = {
      quote: quote.quotation,
      link: `https://www.zitat-service.de/${language}/quotations/${quote.id}`,
      source: quote.source === null ? undefined : quote.source,
      sourceLink: quote.sourceLink === null ? undefined : quote.sourceLink,
      authorId: quote.authorId
    };

    const author: Author[] = await this.authorsRepository.findAuthor({language: language, id: quote.authorId ?? 0}); // using author ID 0 'unknown' in case of problems

    if (author && author.length > 0) {
      randomQuote.authorName = author[0].name;
      randomQuote.authorLink = author[0].link;
    }

    return randomQuote;
  }

}

