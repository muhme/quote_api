/**
 * @file
 * The 'script.js' is the main K6 running script.
 * options are:
 *   -e URL for API e.g. 'URL=http://localhost:3000'
 *   -e SHOW_REQUETS to show all requests, e.g. 'SHOW_REQUESTS=true'
 *   -u parallel virtual users e.g. 100
 *   -d test duration e.g. 1m
 * sample: run -e SHOW_REQUESTS=true -d 10s -u 20 run script.js
 */

import {sleep} from 'k6';
import http from 'k6/http';
import {Counter} from 'k6/metrics';
import * as endpoint from './endpoint.js';
import * as read from './read.js';

export const URL = 'http://localhost:3000';

// additional show counted HTTP status codes in the end
const statusCounters = {
  200: new Counter('http_200_responses'),
  400: new Counter('http_400_responses'),
  404: new Counter('http_404_responses'),
  500: new Counter('http_500_responses'),
  0: new Counter('http_other_responses'),
};

/**
 * setup is called once
 * @returns valid data
 *   - rootUrl e.g. "http://localhost:3000"
 *   - languages e.g. ['de', 'en', 'es', 'ja', 'uk']
 *   - users
 *   ...
 */
export function setup() {
  const rootUrl = __ENV.URL || URL;
  const showRequests = __ENV.SHOW_REQUESTS;
  console.log(`Testing ${rootUrl}`);

  const languages = read.languages();
  // return the full URL so that it can be used in the default function
  return {
    rootUrl: rootUrl,
    showRequests: showRequests,
    languages: languages,
    users: read.users(),
    authors: read.authors(languages),
    categories: read.categories(languages),
  };
}

/**
 * Virtual User code, run the test once per iteration
 * @param {Object} data
 */
export default function (data) {
  const rootUrl = data.rootUrl;
  const whichEndpoint = Math.random();
  let uri;

  // sleep about 50ms and sleep in the beginning to have ramp-up by random()
  sleep(Math.random() * 0.1);

  if (whichEndpoint < 0.02) {
    // 2% home /
    uri = '';
  } else if (whichEndpoint < 0.04) {
    // 2% OpenAPI spec /openapi.json
    uri = 'openapi.json';
  } else if (whichEndpoint < 0.06) {
    // 2% API explorer /explorer
    uri = 'explorer';
  } else if (whichEndpoint < 0.1) {
    // 4% endpoint /languages
    uri = 'languages';
  } else if (whichEndpoint < 0.15) {
    // 5% endpoint /users
    uri = endpoint.users(data.users);
  } else if (whichEndpoint < 0.2) {
    // 5% endpoint /categories
    uri = endpoint.categories(data);
  } else if (whichEndpoint < 0.25) {
    // 5% endpoint /authors
    uri = endpoint.authors(data);
  } else if (whichEndpoint < 0.3) {
    // 5% endpoint /author
    uri = endpoint.author(data);
  } else {
    // 70% endpoint /quote
    uri = endpoint.quote(data);
  }

  const response = http.get(`${rootUrl}/${uri}`);

  // 200 HTTP "OK" is what we want
  // 404 HTTP "Not Found" happens e.g. if there is no quote for the requested language and the request user ID
  if (response.status != 200 && response.status != 404) {
    // else, e.g. have 400 HTTP "Bad Request" e.g. for invalid parameters should not happen
    console.log(`OOPS ${rootUrl}/${uri} returns ${response.status}`);
  } else if (data.showRequests) {
    // show request time in milliseconds, without places after the decimal point and right-aligned
    const durationRounded = Math.round(response.timings.duration);
    const durationString = durationRounded.toString().padStart(4, ' ');
    // show actual hour:minute:second.milliseconds
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    // e.g. "17:30:13.798 GET 200    6 http://localhost:3000/quote?language=ja"
    console.log(
      `${hours}:${minutes}:${seconds}.${milliseconds} GET ${response.status} ${durationString} ${rootUrl}/${uri}`,
    );
  }

  // increment the counters for expected status codes
  if (statusCounters.hasOwnProperty(response.status)) {
    statusCounters[response.status].add(1);
  } else {
    // increment the counter for unexpected status codes
    statusCounters[0].add(1);
  }
}
