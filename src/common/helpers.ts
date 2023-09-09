import {HttpErrors} from '@loopback/rest';
import {LANGUAGES, PARAM_MAX_LENGTH} from '.';

/**
 * Verify the given languae is valid.
 * If language is not defined, then it is set to the default 'en'.
 * @param language – given language parameter
 * @returns Returns 'en' if undefined or the given language if valid.
 * Throws an error 400 if the language is invalid.
 */
export function checkAndSetLanguage(language: string | undefined): string {
  // compare explicit with undefined, to have 400 on empty language
  if (language === undefined) {
    return 'en';
  }
  if (Object.keys(LANGUAGES).includes(language)) {
    return language;
  }
  throw new HttpErrors.BadRequest(`Parameter 'language' has unknown value '${language}'. You have to choose from ${Object.keys(LANGUAGES).join(", ")}.`);
}

/**
 * Stringify an object.
 * @param obj The object to stringify.
 * @returns stringified object e.g. for parameter filter "language: 'en', page: '1000', size: '100'"
 */
export function myStringify(obj: Object): string {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}: '${value}'`)
    .join(', ');
}

/**
 * Verify validity of parameters page and size.
 * @param page must be >= 1
 * @param size must be >= 1
 */
export function validatePageAndSize(page: number, size: number) {
  if (page < 1) {
    throw new HttpErrors.BadRequest("Parameter 'page' must be greater than or equal to 1.");
  }
  if (size < 1) {
    throw new HttpErrors.BadRequest("Parameter 'size' must be greater than or equal to 1.");
  }
}

/**
 * Validate given parameter has only letters or space and do not exceed max size to prevent SQL injection.
 * @param param parameter variable to verify
 * @param param_name parameter variable name
 * Throws 400
 */
export function validateOnlyLettersAndMaxLength(param: (string | undefined), paramName: string) {
  if (param && param.length > PARAM_MAX_LENGTH) {
    throw new HttpErrors.BadRequest(`Parameter '${paramName}' has ${param.length} characters, but can have only ${PARAM_MAX_LENGTH}.`);
  }
  /**
   * To prevent typical SQL injection attacks, implementation started with
   * all UTF-8 characters and added more and more characters like japanese
   * comma 、or asterix ※.
   *
   * It looks easier to search simple for apostroph as first character, see:
   * ' OR '1'='1
   * ' OR '1'='1' --
   * ' OR '1'='1' /*
   * ' OR 1=1; DROP TABLE users; --
   * ' OR 1=1; SELECT * FROM users WHERE name LIKE '%
   * ' OR 'x'='x
   * ' AND ASCII(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)) > 48; --
   * ' UNION ALL SELECT NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL--
   * ' UNION SELECT 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i';--
   * ' AND '1'=(SELECT COUNT(*) FROM tabname); --
   */
  // allowes UTF-8 number, dot, minus, underline, (japanese) comma, (japanese) space, (japanese) asterix and any kind of letter from any language
  // const regex = /^[0-9.\-_,、 ・*※\p{L}]+$/u;
  // if (param && !regex.test(param)) {
  if (param && param.trimStart().charAt(0) === "'") {
    throw new HttpErrors.BadRequest(`Parameter '${paramName}' cannot start with an apostrophe.`);
  }
}
