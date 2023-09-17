/**
 * @file
 * The 'read.js' module provides utility functions for fetching data from API.
 * It exports functions for fetching languages, users, categories, and authors.
 *
 * The collected data is later used to create valid parameters.
 *
 * The functions log to the console the number of items fetched.
 */

import http from 'k6/http';
import {URL} from './script.js';

/**
 * Gets the list of all available languages.
 *
 * @returns {string[]} languages
 */
export function languages() {
  let url = `${URL}/v1/languages`;
  let response = http.get(url);
  const languages = JSON.parse(response.body);
  if (!languages) {
    throw `cannot read languages from ${url}`;
  }
  console.log(`Fetched ${languages.length} languages: ${languages}`);
  return languages;
}

/**
 * Gets the list of all available users.
 *
 * @returns {Object[]} users - user object array with properties:
 *  - id {number}
 *  - login {string}
 */
export function users() {
  let response = http.get(`${URL}/v1/users`);
  let body = JSON.parse(response.body);

  let users = body.users.map(user => {
    return {
      id: user.id,
      login: user.login,
    };
  });

  console.log(`Fetched ${users.length} users`);
  return users;
}

/**
 * Gets the list of all available categories in all languages.
 *
 * @param  {string[]} languages
 *
 * @returns {Object[]} categories - category object array with properties
 *   - id {number}
 *   - for each language category name {string}
 *
 * @example
 * [
 *   { id: 410, de: 'Fähigkeit', en: 'Ability', es: 'Capacidad', ja: '能力',      uk: 'Здатність' },
 *   { id: 124, de: 'Annehmen',  en: 'Accept'   es: 'Acepte',    ja: 'アクセプト', uk: 'Прийняти' },
 *   { id: 428, de: 'Sauer',     en: 'Acid',    es: 'Ácido',     ja: '酸',       uk: 'Кислота' },
 *   ...
 * ]
 */
export function categories(languages) {
  let categoriesMap = new Map();

  for (let language of languages) {
    let response = http.get(
      `${URL}/v1/categories?language=${language}&size=1000`,
    );
    let body = JSON.parse(response.body);

    body.categories.forEach(category => {
      let entry = categoriesMap.get(category.id) || {id: category.id};
      entry[language] = category.category;
      categoriesMap.set(category.id, entry);
    });
  }

  let mergedCategories = Array.from(categoriesMap.values());
  console.log(`Fetched ${mergedCategories.length} categories`);
  return mergedCategories;
}

/**
 * Gets the list of all available authors in all languages.
 *
 * @param {string[]} languages - language codes array
 *
 * @returns {Object[]} - author objects array with properties:
 *  - authorId {number}
 *  - firstname {string}
 *  - lastname {string}
 *  - description {string}
 *
 * @example
 *
 * [
 *   {
 *     authorId: 129,
 *     firstname:
 *       en: 'Immanuel',
 *       ja: 'イマヌエル',
 *       ...
 *     lastname:
 *       en: 'Kant',
 *       ja: 'カント',
 *     description: {
 *       en: 'German philosopher (1724 - 1804)',
 *       ja: 'ドイツの哲学者（1724年 - 1804年）',
 *     },
 *   },
 *   ...
 * ]
 */
export function authors(languages) {
  let authorsMap = new Map();

  for (let language of languages) {
    let response = http.get(`${URL}/v1/authors?language=${language}&size=1000`);
    let body = JSON.parse(response.body);

    body.authors.forEach(author => {
      let entry = authorsMap.get(author.authorId) || {
        authorId: author.authorId,
        firstname: {},
        lastname: {},
        description: {},
      };
      entry.firstname[language] = author.firstname;
      entry.lastname[language] = author.lastname;
      entry.description[language] = author.description;
      authorsMap.set(author.authorId, entry);
    });
  }

  let mergedAuthors = Array.from(authorsMap.values());
  console.log(`Fetched ${mergedAuthors.length} authors`);
  return mergedAuthors;
}
