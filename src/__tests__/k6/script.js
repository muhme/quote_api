import {sleep} from 'k6';
import http from 'k6/http';
import {Counter} from 'k6/metrics';
import {
  randomAuthorIdOrNotParameter,
  randomCategoryIdOrNotParameter,
  randomLanguageOrNotParameter,
  randomUserIdOrNotParameter,
  readAuthorIds,
  readCategoryIds,
  readLanguages,
  readUserIds,
} from './validParameters.js';

export const URL = 'http://localhost:3000';

const statusCounters = {
  200: new Counter('http_200_responses'),
  400: new Counter('http_400_responses'),
  404: new Counter('http_404_responses'),
  500: new Counter('http_500_responses'),
  0: new Counter('http_other_responses'),
};

/**
 * k6 run script.js
 * options are:
 * -e URL=quote (or languages, categories, authors)
 * -u 10 - parallel virtual users
 * -d 1m - duration
 * sample: k6 run -e 'URL=categories?size=1000&language=ja' -d 10s -u 20 script.js
 */

/**
 * setup is called once
 * @returns valid data
 *   .fullUrl e.g. "http://localhost:3000/quote "
 *   .languages e.g. ['de', 'en', 'es', 'ja', 'uk']
 *   .userIds
 */
export function setup() {
  const urlPath = __ENV.URL || 'quote';
  const fullUrl = `${URL}/${urlPath}`;
  console.log(`Testing ${fullUrl}`);

  // return the full URL so that it can be used in the default function
  return {
    fullUrl: fullUrl,
    languages: readLanguages(),
    userIds: readUserIds(),
    authorIds: readAuthorIds(),
    categoryIds: readCategoryIds(),
  };
}

/**
 * Virtual User code, run the test once per iteration
 * @param {*} fullUrl
 */
export default function (data) {
  const fullUrl = data.fullUrl;

  let parameter = randomLanguageOrNotParameter(data);
  if (parameter != '') {
    parameter = `?${parameter}`;
  }
  const whichOne = Math.random();
  if (whichOne < 0.33) {
    const userIdParam = randomUserIdOrNotParameter(data);
    if (parameter == '') {
      parameter = `?${userIdParam}`;
    } else if (userIdParam != '') {
      parameter += `&${userIdParam}`;
    }
  } else if (whichOne < 0.66) {
    const authorIdParam = randomAuthorIdOrNotParameter(data);
    if (parameter == '') {
      parameter = `?${authorIdParam}`;
    } else if (authorIdParam != '') {
      parameter += `&${authorIdParam}`;
    }
  } else {
    const categoryIdParam = randomCategoryIdOrNotParameter(data);
    if (parameter == '') {
      parameter = `?${categoryIdParam}`;
    } else if (categoryIdParam != '') {
      parameter += `&${categoryIdParam}`;
    }
  }
  const response = http.get(`${fullUrl}${parameter}`);

  // increment the counters for expected status codes
  if (statusCounters.hasOwnProperty(response.status)) {
    statusCounters[response.status].add(1);
  } else {
    // increment the counter for unexpected status codes
    statusCounters[0].add(1);
  }

  sleep(1);
}
