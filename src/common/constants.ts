// available languages, corresponding with Ruby on Rails:
// config.i18n.available_locales = [:de, :en, :es, :ja, :uk]
export const LANGUAGES = {
  de: "German",
  en: "English",
  es: "Spanish",
  ja: "Japanese",
  uk: "Ukrainian"
};

export const LANGUAGE_DEFAULT = 'en';
// maximal length for parameters like 'starting', 'firstname' ... to prevent SQL injection
export const PARAM_MAX_LENGTH = 20;
// used as login name if user entry was not found, e.g. in error messages
export const NO_USER_ENTRY = "no user entry";
// used as author name if author entry was not found, e.g. in error messages
export const NO_AUTHOR_ENTRY = "no author entry";
// used as category name if category was not found, e.g. in error messages
export const NO_CATEGORY_ENTRY = "no category entry";
// the URL
export const ZITAT_SERVICE_DE = "https://www.zitat-service.de"
