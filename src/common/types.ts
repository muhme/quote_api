import {Author, Category, User} from '../models';

export interface Paging {
  totalCount: number;
  page: number;
  size: number;
  starting?: string;
}
export interface PagingLocale {
  language: string;
  totalCount: number;
  page: number;
  size: number;
  starting?: string;
}
export interface PagingAuthors {
  language: string;
  totalCount: number;
  page: number;
  size: number;
  firstname?: string;
  lastname?: String;
  description?: String;
}
export interface UsersPaged {
  paging: Paging;
  users: User[];
}
export interface CategoriesPaged {
  paging: PagingLocale;
  categories: Category[];
}
export interface AuthorsPaged {
  paging: PagingAuthors;
  authors: Author[];
}
export interface PagingFilter {
  page: number;
  size: number;
  starting?: string;
}
export interface PagingLocaleFilter {
  language: string;
  page: number;
  size: number;
  starting?: string;
}
export interface AuthorsFilter {
  language: string;
  page: number;
  size: number;
  lastname?: string;
  firstname?: string;
  description?: string;
  lfd?: string; // "lastname, firstname, description"
}
export interface AuthorFilter {
  language: string;
  id: number;
}
export interface QuoteFilter {
  language: string;
  authorId?: number;
  userId?: number;
  categoryId?: number;
}
export interface RandomQuote {
  quote: string;
  link: string;
  source?: string;
  sourceLink?: string;
  authorId: number;
  authorName?: string;
  authorLink?: string;
}
