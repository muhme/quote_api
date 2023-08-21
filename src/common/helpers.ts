import {LOCALES} from './constants';

/**
 *
 * @param locale – given from parameter
 * @returns locale if valid, else 'en'
 */
export function setDefaultLocale(locale: string): string {
  if (!LOCALES.includes(locale)) {
    return 'en';
  }
  return locale;
}
