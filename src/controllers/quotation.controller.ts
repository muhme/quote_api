import {inject} from '@loopback/core';
import {logInvocation} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {api, get, HttpErrors, param, Response, RestBindings} from '@loopback/rest';
import {checkAndSetLanguage, LANGUAGES, QuoteFilter, RandomQuote, SupportedLanguage, ZITAT_SERVICE_DE, ZITAT_SERVICE_DE_URL} from '../common';
import {Author, Quotation} from '../models';
import {AuthorsRepository, CategoriesRepository, QuotationRepository, UsersRepository} from '../repositories';

const DESCRIPTIONS = {
  'language':
    "The language for the random quote. \
    See `/v1/languages` for available languages. \
    If the `language` parameter is not used, quotes are taken from all languages. \
    Author's name and links are in the same language as the quote.",
  'languageHtml':
    "The language for the random quote. \
    See `/v1/languages` for available languages. \
    If the `language` parameter is not used, quotes are taken from all languages. \
    The HTML document language, author's name, links are all in the same language as the quote.",
  'userId':
    "Restrict to pick-up quotes only from given `userId`. \
    See `/v1/users` for the ID numbers of the available user entries.",
  'authorId':
    "Restrict to pick-up quotes only from given `authorId`. \
    See `/v1/authors` for the ID numbers of the available author entries.",
  'categoryId':
    "Restrict to pick-up quotes only from given `categoryId`. \
    See `/v1/categories` for the ID numbers of the available category entries.",
  'style':
    "Specifies a URL that will be used as a CSS stylesheet link \
    in the `<head>` section of the returned HTML document. \
    E.g. `style=https://www.zitat-service.de/quote.css`",
  'contentOnly':
    "If set `true` the quote is delivered with CSS DIVs only, without the HTML header.",
  'target':
    "HTML `target` attribute used in links: When not specified, \
    all links will open in the same window/tab by browser default. \
    Use `_blank` to open each link in a new window/tab or use a custom name \
    like `quote_window` to open all links in a specific other window/tab."
}

const RESPONSES = {
  '200': {
    description: "OK – a random quote retrieved successfully. \
      Always returned are the attributes `quote`, `link` and `authorId`. \
      If they exist, the optional attributes `authorName`, `authorLink`, \
      `source`, and `sourceLink` will be returned. If the author is \
      unknown or not applicable, the `authorId` attribute is 0.",
    content: {
      'application/json': {
        example: {
          quote: "We always overestimate the change that will occur in the next two years and underestimate the change that will occur in the next ten.",
          language: "en",
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
            message: "Parameter 'userId' must be a positive integer."
          }
        }
      },
      'text/html': {
        example: "<html> ... <h1>BadRequestError</h1> <h2><em>400</em> Parameter &#39;userId&#39; must be a positive integer.</h2> ..."
      }
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
            message: "No quote found for given parameters: language=es (Spanish), userId=42 (rezitant), categoryId=42 (Carpintero), authorId=42 (Jean Paul)!"
          }
        }
      },
      'text/html': {
        example: "<html> ... <h1>NotFoundError</h1> <h2><em>404</em> No quote found for given parameters: userId=42 (rezitant), categoryId=21 (Success), authorId=42 (Jean Paul).</h2> ..."
      }
    },
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

const RESPONSES_HTML = {
  '200': {
    description: "OK – a random quote retrieved successfully. \
      Always returned are a linked random quote. \
      If they exist, the optional attributes author and source are given. \
      Are there links for author and source existing, they entries are linked. \
      If the author is unknown or not applicable (`authorId === 0`), \
      this will not be displayed.",
    content: {
      'text/html': {
        example: '<!DOCTYPE html> <html lang="en"> <head> \
          <meta charset="UTF-8"> <title>www.zitat-service.de</title> \
          <link rel="stylesheet" type="text/css" href="https://www.zitat-service.de/quote.css" />\
          </head> <body> <div class="quote"><div class="quotation">\
          <a href="https://www.zitat-service.de/en/quotations/1337">\
          We always overestimate the change that will occur in the next two \
          years and underestimate the change that will occur in the next ten.</a></div>\
          <div class="source">The Road Ahead, Afterword, p. 316, 2006, \
          <a href="https://en.wikipedia.org/wiki/Bill_Gates">Bill Gates</a></div></div> </body> </html> '
      }
    }
  },
  '400': {
    description: 'Bad Request – request format or parameters are invalid.',
    content: {
      'text/html': {
        example: "<html> ... <h1>BadRequestError</h1> <h2><em>400</em> \
          Parameter &#39;userId&#39; must be a positive integer.</h2> ..."
      },
      'application/json': {
        example: {
          error: {
            statusCode: 400,
            name: "BadRequestError",
            message: "Parameter 'userId' must be a positive integer."
          }
        }
      }
    }
  },
  '404': {
    description: 'Not Found – no random quote found for the given parameters.',
    content: {
      'text/html': {
        example: "<html> ... <h1>NotFoundError</h1> <h2><em>404</em> No quote \
          found for given parameters: userId=42 (rezitant), \
          categoryId=21 (Success), authorId=42 (Jean Paul).</h2> ..."
      },
      'application/json': {
        example: {
          error: {
            statusCode: 404,
            name: "NotFoundError",
            message: "No quote found for given parameters: language=es (Spanish), \
            userId=42 (rezitant), categoryId=42 (Carpintero), authorId=42 (Jean Paul)!"
          }
        }
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
    public authorsRepository: AuthorsRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(CategoriesRepository)
    public categoriesRepository: CategoriesRepository,
    @inject(RestBindings.Http.RESPONSE) protected response: Response
  ) { }

  /**
   * /v1/quote – random quote in JSON
   *
   * @param language
   * @param userId
   * @param authorId
   * @param categoryId
   * @returns RandomQuote for JSON output
   */
  // http access is logged by global interceptor
  @get('/v1/quote', {
    tags: ['Random Quote'],
    responses: RESPONSES,
    operationId: 'get-quotation',
    summary: "Get one random quote with source, author and links in JSON format.",
    description: "Get one random quote with source, author and links in JSON \
      format, similar to `/v1/quote_html` for HTML format. Can be \
      requested for `language`, `authorId`, `categoryId` or `userId`. \
      Only public quotes are used. \
      Multiple parameters can be combinded e.g. \
      `language=de&authorId=46&categoryId=17` for German (de) quotes \
      only from author Laozi (#46) and category Learning (#17)."
  })
  // log method invocation
  @logInvocation()
  async getQuotationJson(
    @param.query.string('language', {
      description: DESCRIPTIONS['language']
    }) language?: SupportedLanguage,
    @param.query.integer('userId', {
      description: DESCRIPTIONS['userId']
    }) userId?: number,
    @param.query.integer('authorId', {
      description: DESCRIPTIONS['authorId']
    }) authorId?: number,
    @param.query.integer('categoryId', {
      description: DESCRIPTIONS['categoryId']
    }) categoryId?: number
  ): Promise<RandomQuote> {

    this.validateParameters(userId, authorId, categoryId);

    // for quotes, only check if language is set (w/o language simple return quotes from any language)
    if (language !== undefined) {
      checkAndSetLanguage(language)
    }

    const filter: QuoteFilter = {language, userId, authorId, categoryId};

    const quote = await this.quotationRepository.findQuotation(filter);

    if (!quote.length) {
      await this.throwNotFoundWithGivenParameters(filter);
    }
    if (!quote || quote.length !== 1) {
      throw new HttpErrors.NotFound(`Could not find a quote for given parameters.`);
    }

    return this.mapQuoteToRandomQuote(quote[0]);
  }

  /**
   * /v1/quote_html – random quote for HTML output
   *
   * @param language
   * @param userId
   * @param authorId
   * @param categoryId
   * @param style
   * @param contentOnly
   * @param target
   * @returns Promise<void>
   */
  // http access is logged by global interceptor
  @get('/v1/quote_html', {
    tags: ['Random Quote'],
    responses: RESPONSES_HTML,
    operationId: 'get-quotation-html',
    summary: "Get a random quote with source, author and links in HTML format with optional style.",
    description: "Get a random quote with source, author and links in HTML \
      format with optional style, similar to `/v1/quote` in JSON format. \
      All parameters are optional. Only public quotes are available. \
      Multiple parameters can be combinded e.g. \
      `language=de&authorId=46&categoryId=17` for German (de) quotes \
      only from author Laozi (#46) and category Learning (#17)."
  })
  // log method invocation
  @logInvocation()
  async getQuotations(
    @param.query.string('language', {
      description: DESCRIPTIONS['languageHtml']
    }) language?: SupportedLanguage,
    @param.query.integer('userId', {
      description: DESCRIPTIONS['userId']
    }) userId?: number,
    @param.query.integer('authorId', {
      description: DESCRIPTIONS['authorId']
    }) authorId?: number,
    @param.query.integer('categoryId', {
      description: DESCRIPTIONS['categoryId']
    }) categoryId?: number,
    @param.query.string('style', {
      description: DESCRIPTIONS['style']
    }) style?: string,
    @param.query.boolean('contentOnly', {
      description: DESCRIPTIONS['contentOnly'],
      schema: {
        type: 'boolean',
        default: false
      }
    }) contentOnly?: boolean,
    @param.query.string('target', {
      description: DESCRIPTIONS['target']
    }) target?: string
  ): Promise<void> {

    this.validateParameters(userId, authorId, categoryId);

    // for quotes, only check if language is set (w/o language simple return quotes from any language)
    if (language !== undefined) {
      checkAndSetLanguage(language)
    }

    const filter: QuoteFilter = {language, userId, authorId, categoryId};

    const quote = await this.quotationRepository.findQuotation(filter);

    if (!quote.length) {
      await this.throwNotFoundWithGivenParameters(filter);
    }
    if (!quote || quote.length !== 1) {
      throw new HttpErrors.NotFound(`Could not find a quote for given parameters.`);
    }

    const result = await this.mapQuoteToHtml(quote[0], style, contentOnly, target);


    // as @loopback4/rest/src/writer.ts simple set
    //    response.setHeader('Content-Type', 'text/plain');
    // to have 'text/html', we need to send ourselves
    // see https://github.com/loopbackio/loopback-next/issues/5168
    this.response.contentType('text/html');
    this.response.status(200);
    this.response.send(result);
    return;
    // no need to catch errors and handle them by yourself,
    // since LB4 already sends text/html (or application/json, if requested)
  }

  // map quote to JSON RandomQuote output
  private async mapQuoteToRandomQuote(quote: Quotation): Promise<RandomQuote> {

    const randomQuote: RandomQuote = {
      quote: quote.quotation,
      language: quote.language,
      link: ZITAT_SERVICE_DE_URL + `/${quote.language}/quotations/${quote.id}`,
      source: quote.source ?? undefined,
      sourceLink: quote.sourceLink ?? undefined,
      authorId: quote.authorId
    };

    const author: (Author | undefined) = await this.authorsRepository.
      findAuthor({language: quote.language, authorId: quote.authorId ?? 0});
    // using author ID 0 'unknown' in case of problems

    if (author) {
      randomQuote.authorName = author.name;
      randomQuote.authorLink = author.link;
    }

    return randomQuote;
  }

  // map quote to HTML output
  private async mapQuoteToHtml(
    quote: Quotation,
    style: string | undefined,
    contentOnly: boolean | undefined,
    target: string | undefined): Promise<string> {

    let randomQuote = '';

    if (contentOnly !== true) {
      randomQuote += this.htmlBegin(quote.language, style);
    }

    randomQuote += await this.divContainers(quote, target);

    if (contentOnly !== true) {
      randomQuote += '</body>\n</html>\n'
    }

    return randomQuote;
  }

  private validateParameters(userId?: number, authorId?: number, categoryId?: number): void {
    if (userId && userId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'userId' must be a positive integer.");
    }
    if (authorId && authorId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'authorId' must be a positive integer.");
    }
    if (categoryId && categoryId < 0) {
      throw new HttpErrors.BadRequest("Parameter 'categoryId' must be a positive integer.");
    }
  }

  // create descriptive error message with all parameters set and throw 404
  private async throwNotFoundWithGivenParameters(filter: QuoteFilter) {

    const givenParams = [];
    if (filter.language !== undefined) {
      givenParams.push(`language=${filter.language} (${LANGUAGES[filter.language]})`);
    }
    if (filter.userId !== undefined) {
      const loginName = await this.usersRepository.loginName(filter.userId);
      givenParams.push(`userId=${filter.userId} (${loginName})`);
    }
    if (filter.categoryId !== undefined) {
      const categoryName = await this.categoriesRepository.categoryName(filter.categoryId, filter.language);
      givenParams.push(`categoryId=${filter.categoryId} (${categoryName})`);
    }
    if (filter.authorId !== undefined) {
      const authorName = await this.authorsRepository.authorName(filter.authorId, filter.language);
      givenParams.push(`authorId=${filter.authorId} (${authorName})`);
    }
    throw new HttpErrors.NotFound(`No quote found for given parameters: ${givenParams.join(", ")}.`);
  }

  // return HTML beginning
  private htmlBegin(language: string, style: string | undefined): string {
    let html = '<!DOCTYPE html>\n';
    html += `<html lang="${language}">\n`;
    html += '<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html += `  <title>${ZITAT_SERVICE_DE}</title>\n`;
    if (style) {
      html += `  <link rel="stylesheet" type="text/css" href="${style}" />`;
    }
    html += '</head>\n';

    html += '<body>\n';

    return html;
  }

  // create all the <div>
  //
  // <div class="quote">
  //   <div class="quotation">
  //     <a href="https://www.zitat-service.de/quotations/1273">Wenn Du Dich zeigst, wird man Dich sehen.</a>
  //   </div>
  //   <div class="source">
  //     <a href="https://www.schauspieltraining-berlin.de">Christine Kostropetsch</a>
  //     ,
  //     <a href="http://www.schauspieltraining-berlin.de">Schauspieltraining in Berlin, 2010</a>
  //   </div>
  // </div>
  private async divContainers(quote: Quotation, target: string | undefined): Promise<string> {

    const link = ZITAT_SERVICE_DE_URL + `/${quote.language}/quotations/${quote.id}`;
    const spaceTarget = (target === undefined) ? "" : ` target="${target}"`;

    let ret = '  <div class="quote">';
    ret += '<div class="quotation">';
    ret += `<a href="${link}"${spaceTarget}>${quote.quotation}</a>`;
    ret += '</div>';

    if (quote.source || quote.authorId !== 0) {

      ret += '<div class="source">';

      if (quote.source) {
        if (quote.sourceLink) {
          ret += `<a href="${quote.sourceLink}"${spaceTarget}>`;
        }
        ret += quote.source;
        if (quote.sourceLink) {
          ret += '</a>';
        }
      }

      // not unknown?
      if (quote.authorId !== 0) {

        // using author ID 0 'unknown' in case of problems
        const author: (Author | undefined) = await this.authorsRepository.
          findAuthor({language: quote.language, authorId: quote.authorId ?? 0});

        if (author) {
          if (quote.source) {
            ret += ', ';
          }
          if (author.link) {
            ret += `<a href="${author.link}"${spaceTarget}>`;
          }
          ret += author.name;
          if (author.link) {
            ret += '</a>';
          }
        }
      }
      ret += "</div>";
    }
    ret += '</div>\n';

    return ret;
  }

}
