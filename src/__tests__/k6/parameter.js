/**
 * @file
 * The 'parameter.js' module collects all methods for creating parameters.
 */

/**
 * @returns random valid userID parameter like "userId=42"
 */
export function randomUserIdOrNotParameter(data) {
  return `userId=${
    data.users[Math.floor(Math.random() * data.users.length)].id
  }`;
}

/**
 * @param {Object} data with valid data.authors
 * @returns random valid authorID parameter like "authorId=42"
 */
export function randomAuthorIdOrNotParameter(data) {
  return `authorId=${
    data.authors[Math.floor(Math.random() * data.authors.length)].authorId
  }`;
}

/**
 * @param {Object} data with valid data.categories
 * @returns random valid categoryID parameter like "categoryId=42"
 */
export function randomCategoryIdOrNotParameter(data) {
  // randomly 50% decide to either use parameter or not
  return `categoryId=${
    data.categories[Math.floor(Math.random() * data.categories.length)].id
  }`;
}

/**
 * @param {string} language
 * @returns language parameter like "language=uk"
 */
export function languageParameter(language) {
  return `language=${language}`;
}

/**
 * Returns random valid language.
 *
 * @param {Object} data with valid data.languages
 * @returns random language, e.g. "ja"
 */
export function randomLanguage(data) {
  return data.languages[Math.floor(Math.random() * data.languages.length)];
}

/**
 * e.g. "starting=Acc" for random choosen category "Accept" for language "en"
 * @param {object[]} categories
 * @param {string} language
 * @returns {string}
 */
export function randomStartingCategoryParameter(categories, language) {
  // choose random category in array
  const categoryNumber = Math.floor(categories.length * Math.random());
  // pick-up category name in given language
  const category = categories[categoryNumber][language];
  // calculate random length and ensure we have at least one character
  const length = 1 + Math.floor(Math.random() * category.length - 1);
  // ensure not more than 20 characters
  if (length > 20) {
    length = 20;
  }
  return `starting=${encodeURIComponent(category.slice(0, length))}`;
}

/**
 * Returns 'starting' parameter with a random number of initial letters of a valid user login.
 *
 * @param {Object[]} users
 * @returns {string}
 */
export function randomStartingUserParameter(users) {
  // choose one valid user login
  const userNumber = Math.floor(users.length * Math.random());
  // pick-up login name
  const login = users[userNumber].login;
  // calculate random length and ensure we have at least one character
  const length = 1 + Math.floor(Math.random() * (login.length - 1));
  // ensure not more than 20 characters
  if (length > 20) {
    length = 20;
  }
  return `starting=${encodeURIComponent(login.slice(0, length))}`;
}

/**
 * Returns one of the four author parameters with initial letters from given author.
 *
 * e.g. "starting=Acc" for random choosen category "Accept" for language "en"
 * @param {Object} author
 * @param {string} property 'firstname', 'lastname', 'description' or 'lfd'
 * @param {string} language
 * @returns {string}
 */
export function randomStartingAuthorParameter(author, property, language) {
  let ret = '';
  if (property == 'lfd') {
    if (
      author['lastname'] &&
      author['lastname'][language] &&
      author['lastname'][language].length > 0
    ) {
      ret += author['lastname'][language];
    }
    ret += ',';
    if (
      author['firstname'] &&
      author['firstname'][language] &&
      author['firstname'][language].length > 0
    ) {
      ret += author['firstname'][language];
    }
    ret += ',';
    if (
      author['description'] &&
      author['description'][language] &&
      author['description'][language].length > 0
    ) {
      ret += author['description'][language];
    }
  } else if (
    author[property] &&
    author[property][language] &&
    author[property][language].length > 0
  ) {
    // pick-up author property in given language
    ret = author[property][language];
  }

  if (ret.length > 0) {
    // calculate random length and ensure we have at least one character
    let length = 1 + Math.floor(Math.random() * ret.length - 1);
    // but not more than 20 as this is max
    if (length > 20) {
      length = 20;
    }
    ret = ret.slice(0, length);
    return `${property}=${encodeURIComponent(ret)}`;
  } else {
    return '';
  }
}

/**
 * Returns valid paging parameters for given length.
 *   30% page=1&size=length
 *   20% page=1&size=1000000
 *   50% page=N&size=10 with N is 1 ... length/20
 * @param {number} length
 * @returns {string}
 */
export function randomPageAndSizeParameter(length) {
  const random = Math.random();
  if (random <= 0.3) {
    return `page=1&size=${length}`;
  }
  if (random <= 0.5) {
    return 'page=1&size=1000000';
  }
  return `size=10&page=${Math.floor(1 + (length / 10) * Math.random())}`;
}
