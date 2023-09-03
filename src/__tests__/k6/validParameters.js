import http from 'k6/http';
import {URL} from './script.js';

/**
 * @returns 50% "" and 50% random valid userID parameter like "?userId=42"
 */
export function randomUserIdOrNotParameter(data) {
  // randomly 50% decide to either use parameter or not
  return Math.random() < 0.5
    ? ''
    : `userId=${data.userIds[Math.floor(Math.random() * data.userIds.length)]}`;
}
/**
 * @returns 50% "" and 50% random valid authorID parameter like "?authorId=42"
 */
export function randomAuthorIdOrNotParameter(data) {
  // randomly 50% decide to either use parameter or not
  return Math.random() < 0.5
    ? ''
    : `authorId=${
        data.authorIds[Math.floor(Math.random() * data.authorIds.length)]
      }`;
}
/**
 * @returns 50% "" and 50% random valid categoryID parameter like "?categoryId=42"
 */
export function randomCategoryIdOrNotParameter(data) {
  // randomly 50% decide to either use parameter or not
  return Math.random() < 0.5
    ? ''
    : `categoryId=${
        data.categoryIds[Math.floor(Math.random() * data.categoryIds.length)]
      }`;
}

/**
 * @returns 10% "" and 90% random valid language parameter like "language=es"
 */
export function randomLanguageOrNotParameter(data) {
  // randomly decide to either use no language or select a random one from the array
  const useLanguage = Math.random() < 0.9; // 90% chance to use a language, 10% w/o
  let parameter = '';
  if (useLanguage) {
    const randomLang = randomLanguage(data);
    parameter += `language=${randomLang}`;
  }
  return parameter;
}

/**
 *
 * @returns random language, e.g. "ja"
 */
export function randomLanguage(data) {
  return data.languages[Math.floor(Math.random() * data.languages.length)];
}
export function readLanguages() {
  let url = `${URL}/languages`;
  let response = http.get(url);
  const languages = JSON.parse(response.body);
  if (!languages) {
    throw `cannot read languages from ${url}`;
  }
  console.log(`Fetched ${languages.length} languages: ${languages}`);
  return languages;
}

export function readUserIds() {
  let response = http.get(`${URL}/users`);
  let body = JSON.parse(response.body);
  let userIds = body.users.map(user => user.id);
  console.log(`Fetched ${userIds.length} user IDs`);
  return userIds;
}
export function readAuthorIds() {
  let response = http.get(`${URL}/authors?size=1000`);
  let body = JSON.parse(response.body);
  let authorIds = body.authors.map(author => author.id);
  console.log(`Fetched ${authorIds.length} author IDs`);
  return authorIds;
}
export function readCategoryIds() {
  let response = http.get(`${URL}/categories?size=1000`);
  let body = JSON.parse(response.body);
  let categoryIds = body.categories.map(category => category.id);
  console.log(`Fetched ${categoryIds.length} category IDs`);
  return categoryIds;
}
