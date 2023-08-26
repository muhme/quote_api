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
