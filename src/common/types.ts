import {Author, Category, User} from '../models';
import {LANGUAGES} from './constants';

// *Paging
export interface BasePaging {
  totalCount: number;
  page: number;
  size: number;
}
export interface Paging extends BasePaging {
  starting?: string;
}
export interface PagingLanguage extends BasePaging {
  language: string;
  starting?: string;
}
export interface PagingAuthors extends BasePaging {
  language: string;
  firstname?: string;
  lastname?: string;
  description?: string;
}

// *Paged
export interface UsersPaged {
  paging: Paging;
  users: User[];
}
export interface CategoriesPaged {
  paging: PagingLanguage;
  categories: Category[];
}
export interface AuthorsPaged {
  paging: PagingAuthors;
  authors: Author[];
}

// *Filter
export interface BaseFilter {
  page: number;
  size: number;
}
export interface PagingFilter extends BaseFilter {
  starting?: string;
}
export interface PagingLanguageFilter extends BaseFilter {
  language: string;
  starting?: string;
}
export interface AuthorsFilter extends BaseFilter {
  language: string;
  lastname?: string;
  firstname?: string;
  description?: string;
  lfd?: string; // Consider giving a more descriptive name if possible
}
export interface AuthorFilter {
  language: string;
  id: number;
}
export interface QuoteFilter {
  language?: SupportedLanguage;
  authorId?: number;
  userId?: number;
  categoryId?: number;
}

// *Returned
export interface AuthorReturned {
  author: Author;
}
export interface RandomQuote {
  quote: string;
  language: string;
  link: string;
  source?: string;
  sourceLink?: string;
  authorId: number;
  authorName?: string;
  authorLink?: string;
}

export type SupportedLanguage = keyof typeof LANGUAGES;
