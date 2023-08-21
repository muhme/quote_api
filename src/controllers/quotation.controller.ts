import {repository} from '@loopback/repository';
import {HttpErrors, api, operation, param} from '@loopback/rest';
import {Quotation} from '../models/quotation.model';
import {AuthorsRepository} from '../repositories/authors.repository';
import {QuotationFilter, QuotationRepository} from '../repositories/quotation.repository';

/**
 * /quotation controller - get one random quote
 */
@api({
  paths: {},
})
export class QuotationController {
  constructor(
    @repository(QuotationRepository)
    public quotationRepository: QuotationRepository,

    @repository(AuthorsRepository)
    public authorsRepository: AuthorsRepository
  ) { }
  @operation('get', '/quote', {
    tags: ['Random Quote'],
    responses: {
      '200': {
        description: 'OK – a random quote was successfully retrieved.',
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
    operationId: 'get-quotation',
    summary: 'Get random quote with source, author and links. Can be requested for language, author, category or user. Only public quotes are provided.'
  })
  async getQuotations(
    @param({
      name: 'language',
      in: 'query',
      description: 'The language for the random quote. See /languages for available languages.',
      required: false,
      schema: {
        type: 'string',
        default: 'en'
      }
    }) language = 'en',
    @param({
      name: 'userId',
      in: 'query',
      description: 'Get only a quote from author with given ID. See /users for available user entries.',
      required: false,
      schema: {
        type: 'number'
      }
    }) userId?: number,
    @param({
      name: 'authorId',
      in: 'query',
      description: 'Get only a quote created by user with given ID. See /authors for available author entries.',
      required: false,
      schema: {
        type: 'number'
      }
    }) authorId?: number,
    @param({
      name: 'categoryId',
      in: 'query',
      description: 'Get only a quote from the category with given ID. See /categories for available categegory entries.',
      required: false,
      schema: {
        type: 'number'
      }
    }) categoryId?: number,
  ): Promise<Quotation[]> {
    const filter: QuotationFilter = {
      language: language,
      authorId: authorId,
      userId: userId,
      categoryId: categoryId
    };

    const quote = await this.quotationRepository.findQuotation(filter);
    quote[0].quotationLink = `https://www.zitat-service.de/${filter.language}/quotations/${quote[0].id}`;

    let author;
    if (quote && quote.length > 0) {
      author = await this.authorsRepository.findAuthor({language: filter.language, id: quote[0].authorId ?? 0}); // using author ID 0 'unknown' in case of problems
    } else {
      throw new HttpErrors.NotFound(`Could not find a quote for given parameters!`);
    }
    if (author && author.length > 0) {
      quote[0].author = author[0];
    }
    // else: ignore missing author entry

    delete quote[0].authorId; // Remove the top-level authorId

    console.log(JSON.stringify(author, null, 2));
    console.log(JSON.stringify(quote, null, 2));
    return quote;
  }
}
