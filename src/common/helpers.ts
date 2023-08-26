import {HttpErrors} from '@loopback/rest';
import {LOCALES} from './constants';

/**
 * check language validity or set default if undefined
 * @param language – given from parameter
 * @returns language if valid, 'en' if undefined, else throws 400
 */
export function checkAndSetLanguage(language: string | undefined): string {
  if (language === undefined) {
    return 'en';
  }
  if (LOCALES.includes(language)) {
    return language;
  }
  throw new HttpErrors.BadRequest(`Parameter 'language' has unknown value '${language}'.`);
}

/**
 *
 * @param obj
 * @returns stringified object e.g. param filter "language: 'en', page: 1000, size: 100"
 */
export function myStringify<T = Record<string, unknown>>(obj: T): string {
  const result: string[] = [];
  for (const key in obj) {
    const value = obj[key];

    if (value !== undefined) {
      // Determine how to format the value
      if (typeof value === 'string') {
        result.push(`${key}: '${value}'`);
      } else {
        result.push(`${key}: ${value}`);
      }
    }
  }
  return result.join(', ');
}
