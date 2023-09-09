/**
 * @file
 * The 'endpoint.js' module collects all methods for calling API endpoints.
 */

import {
  languageParameter,
  randomAuthorIdOrNotParameter,
  randomCategoryIdOrNotParameter,
  randomLanguage,
  randomPageAndSizeParameter,
  randomStartingAuthorParameter,
  randomStartingCategoryParameter,
  randomStartingUserParameter,
  randomUserIdOrNotParameter,
} from './parameter.js';

/**
 * Returns endpoint '/quote' with valid random parameters language, UserId, AuthorId and/or CategoryId.
 * @param {Object} data
 * @returns e.g. "quote?language=uk&authorId=509"
 */
export function quote(data) {
  // 10% none, 90% one valid language
  let parameter = addParam('', languageParameter(randomLanguage(data)), 0.9);
  const whichOne = Math.random();
  if (whichOne < 0.1) {
    parameter = addParam(parameter, randomUserIdOrNotParameter(data), 0.5);
  } else if (whichOne < 0.2) {
    parameter = addParam(parameter, randomAuthorIdOrNotParameter(data));
  } else if (whichOne < 0.3) {
    parameter = addParam(parameter, randomCategoryIdOrNotParameter(data), 0.5);
  }
  return `quote${parameter}`;
}

/**
 * Returns endpoint '/users' with random valid parameters page&size or starting.
 * @param {Object[]} users
 * @returns e.g. "/users?starting=Sabin"
 */
export function users(users) {
  let parameter;
  // 5% with page&size
  if (Math.random() < 0.1) {
    parameter = addParam('', randomPageAndSizeParameter(users.length), 0.9);
    // other 90% with firstname
  } else {
    // independent 50% some starting characters from valid firstname
    parameter = addParam('', randomStartingUserParameter(users));
  }
  return `users${parameter}`;
}

/**
 * Returns endpoint '/author' with random valid parameters language and/or AuthorId.
 * @param {Object} data
 * @returns e.g. "/author?language=de&authorId=412"
 */
export function author(data) {
  // 10% none, 90% valid language
  let parameter = addParam('', languageParameter(randomLanguage(data)), 0.9);
  // 10% none, 90% valid random authorId
  parameter = addParam(parameter, randomAuthorIdOrNotParameter(data), 0.9);
  return `author${parameter}`;
}

/**
 * Returns endpoint '/authors' with random valid parameters language, page&size, firstname, lastname, description or lfd.
 * @param {Object} data
 * @returns e.g.
 */
export function authors(data) {
  const language = randomLanguage(data);
  let parameter;
  // 10% with page&size
  if (Math.random() < 0.1) {
    // 9% valid language
    parameter = addParam('', languageParameter(language), 0.9);
    parameter = addParam(
      parameter,
      randomPageAndSizeParameter(data.authors.length),
      0.9,
    );
    // other 90% with firstname/lastname/description/lfd
  } else {
    // with starting we need the language
    parameter = addParam('', languageParameter(language));
    // choose random author in array to have the same author
    const authorNumber = Math.floor(data.authors.length * Math.random());
    const author = data.authors[authorNumber];
    if (Math.random() < 0.2) {
      // independent 18% some starting characters from valid firstname
      parameter = addParam(
        parameter,
        randomStartingAuthorParameter(author, 'firstname', language),
      );
    }
    if (Math.random() < 0.2) {
      // independent 18% some starting characters from valid lastname
      parameter = addParam(
        parameter,
        randomStartingAuthorParameter(author, 'lastname', language),
      );
    }
    if (Math.random() < 0.2) {
      // independent 18% some starting characters from valid description
      parameter = addParam(
        parameter,
        randomStartingAuthorParameter(author, 'description', language),
      );
    }
    if (Math.random() < 0.2) {
      // independent 18% some starting characters from valid lastname,firstname,description
      // lfd is overwriting possible existing firstname, lastname or description parameter, but for this test it doesn't matter
      parameter = addParam(
        parameter,
        randomStartingAuthorParameter(author, 'lfd', language),
      );
    }
  }
  return `authors${parameter}`;
}

/**
 * create parameter for endpoint /categories with:
 *   -  9% language parameter set
 *   -  9% valid page and size parameter set
 *   - 90% starting parameter with random number of initial letters for valid category
 */
export function categories(data) {
  const language = randomLanguage(data);
  let param = '';
  // 10% with page&size
  if (Math.random() < 0.1) {
    // 9% valid language
    param = addParam(param, languageParameter(language), 0.9);
    param = addParam(
      param,
      randomPageAndSizeParameter(data.authors.length),
      0.9,
    );
  } else {
    // other 90% with starting
    // with starting we need the language
    param = addParam(param, languageParameter(language));
    param = addParam(
      param,
      randomStartingCategoryParameter(data.categories, language),
    );
  }

  return `categories${param}`;
}

/**
 * Extend a URL's query parameters.
 *
 * @param {string} param - current URL parameter(s)
 * @param {string} toAdd - parameter to add
 * @param {number|null} probability - 0 ... 1 probablity to add the paremeter
 * @returns {string} - parameter string with the added parameter
 */
function addParam(param, toAdd, probability = 1) {
  // is there a parameter given to add?
  if (toAdd !== '') {
    // check probability
    if (probability >= Math.random()) {
      // start 1st parameter with a '?', otherwise, append with an '&' separator
      param += param === '' ? '?' : '&';
      param += toAdd;
    }
  }

  return param;
}
