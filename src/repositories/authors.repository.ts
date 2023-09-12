import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {AuthorFilter, AuthorsFilter, AuthorsPaged, LANGUAGE_DEFAULT, NO_AUTHOR_ENTRY, PagingAuthors} from '../common';
import {MariaDbDataSource} from '../datasources';
import {Author, combineAuthorName} from '../models';
// import {MyLogger} from '../providers';
// import {LoggingBindings, WinstonLogger} from '@loopback/logging';

export class AuthorsRepository extends DefaultCrudRepository<
  Author,
  typeof Author.prototype.id
> {
  constructor(
    // @loopback/logging winston logger
    //@inject(LoggingBindings.WINSTON_LOGGER) private logger: WinstonLogger,
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSource
  ) {
    super(Author, dataSource);
  }

  /**
   * Get paged list of author entries.
   * @param filter – language, page, size, lastname, firstname, description
   * @returns AuthorsPaged
   */
  async findAuthors(filter: AuthorsFilter): Promise<AuthorsPaged> {

    const params = new Array(4).fill(filter.language);

    // generate dynamic query conditions
    let whereClause = "";
    if (filter.lastname) {
      whereClause += "mst_name.value LIKE ? AND "
      params.push(filter.lastname + '%');
    }
    if (filter.firstname) {
      whereClause += "mst_firstname.value LIKE ? AND "
      params.push(filter.firstname + '%');
    }
    if (filter.description) {
      whereClause += "mst_description.value LIKE ? AND "
      params.push(filter.description + '%');
    }

    // execute count query
    const totalCountResult = await this.dataSource.execute(this.countSqlQuery(whereClause), params);

    // extend params with paging parameters and execute the main query
    params.push(((filter.page - 1) * filter.size), filter.size);
    let authors = await this.dataSource.execute(this.mainSqlQuery(whereClause), params);

    // exclude all null attributes from OpenAPI output
    // create name from firstname and lastname
    authors = this.washAuthorsAttributes(authors, filter.language);

    return {
      paging: this.createPagingAuthors(filter, totalCountResult[0].totalCount),
      authors: authors
    };
  }

  /**
   * get Author by ID
   *
   * @param locale, id
   * @returns Author
   */
  async findAuthor(filter: AuthorFilter): Promise<Author | undefined> {

    const params = new Array(4).fill(filter.language);
    params.push(filter.authorId)

    const authors = await this.dataSource.execute(this.authorByIdSqlQuery(), params);

    return (authors.length === 1) ? this.washAuthorsAttributes(authors, filter.language)[0] : undefined;
  }

  /**
   * Get author name for given identifier in given locale.
   * This is a easier implementation and garantiee always string return as used for error messages.
   *
   * @param id unique identifier (authors.id)
   * @param language locale for authors name (mobility_string_translations.locale) or undefined and default 'en' will be used
   * @returns authors name as e.g. "firstname name" in given locale or "no author entry"
   */
  async authorName(authorId: number, language: string | undefined): Promise<string> {

    if (!language) {
      language = LANGUAGE_DEFAULT;
    }
    const [result] = await this.dataSource.execute(this.authorsNameSqlQuery(), [authorId, language, language]);

    if (!result) {
      return NO_AUTHOR_ENTRY;
    }
    const name = combineAuthorName(result.firstname, result.lastname, language);
    // this.logger.log('debug', `authorName: found name ${name} for ID ${authorId} in language ${language}`);
    return name;
  }

  // exclude all null attributes from OpenAPI output
  // create name from firstname and lastname
  private washAuthorsAttributes(authors: Author[], language: string): Author[] {
    for (const author of authors) {
      if (author.firstname === null) author.firstname = undefined;
      if (author.lastname === null) author.lastname = undefined;
      if (author.description === null) author.description = undefined;
      if (author.link === null) author.link = undefined;
      author.name = combineAuthorName(author.firstname, author.lastname, language);
    }
    return authors;
  }

  /**
   * fill structure PagingAuthors
   * @param filter
   * @param totalCount
   * @returns PaginAuthors
   */
  private createPagingAuthors(filter: AuthorsFilter, totalCount: number): PagingAuthors {
    return {
      language: filter.language,
      totalCount: totalCount,
      page: filter.page,
      size: filter.size,
      ...(filter.lastname && {lastname: filter.lastname}),
      ...(filter.firstname && {firstname: filter.firstname}),
      ...(filter.description && {description: filter.description})
    };
  }

  // whereClause is between "" and
  // "mst_name.value LIKE ? AND mst_firstname.value LIKE ? AND  mst_description.value LIKE ? AND "
  private mainSqlQuery(whereClause: string): string {
    return `
      SELECT DISTINCT
          a.id AS authorId,
          mst_name.value AS lastname,
          mst_firstname.value AS firstname,
          mst_description.value AS description,
          mst_link.value AS link
        FROM
          authors a
        LEFT JOIN
          mobility_string_translations mst_name
          ON a.id = mst_name.translatable_id
          AND mst_name.translatable_type = 'Author'
          AND mst_name.locale = ?
          AND mst_name.key = 'name'
        LEFT JOIN
          mobility_string_translations mst_firstname
          ON a.id = mst_firstname.translatable_id
          AND mst_firstname.translatable_type = 'Author'
          AND mst_firstname.locale = ?
          AND mst_firstname.key = 'firstname'
        LEFT JOIN
          mobility_string_translations mst_description
          ON a.id = mst_description.translatable_id
          AND mst_description.translatable_type = 'Author'
          AND mst_description.locale = ?
          AND mst_description.key = 'description'
        LEFT JOIN
          mobility_string_translations mst_link
          ON a.id = mst_link.translatable_id
          AND mst_link.translatable_type = 'Author'
          AND mst_link.locale = ?
          AND mst_link.key = 'link'
        WHERE
          ${whereClause}
          a.public = 1
        ORDER BY
          mst_name.value ASC
        LIMIT ?, ?;
    `;
  }
  private countSqlQuery(whereClause: string): string {
    return `
      SELECT COUNT(DISTINCT a.id) as totalCount
      FROM
        authors a
      LEFT JOIN
        mobility_string_translations mst_name
        ON a.id = mst_name.translatable_id
        AND mst_name.translatable_type = 'Author'
        AND mst_name.locale = ?
        AND mst_name.key = 'name'
      LEFT JOIN
        mobility_string_translations mst_firstname
        ON a.id = mst_firstname.translatable_id
        AND mst_firstname.translatable_type = 'Author'
        AND mst_firstname.locale = ?
        AND mst_firstname.key = 'firstname'
      LEFT JOIN
        mobility_string_translations mst_description
        ON a.id = mst_description.translatable_id
        AND mst_description.translatable_type = 'Author'
        AND mst_description.locale = ?
        AND mst_description.key = 'description'
      LEFT JOIN
        mobility_string_translations mst_link
        ON a.id = mst_link.translatable_id
        AND mst_link.translatable_type = 'Author'
        AND mst_link.locale = ?
        AND mst_link.key = 'link'
      WHERE
        ${whereClause}
        a.public = 1
    `;
  }
  private authorByIdSqlQuery(): string {
    return `
      SELECT DISTINCT
          a.id AS authorId,
          mst_name.value AS lastname,
          mst_firstname.value AS firstname,
          mst_description.value AS description,
          mst_link.value AS link
        FROM
          authors a
        LEFT JOIN
          mobility_string_translations mst_name
          ON a.id = mst_name.translatable_id
          AND mst_name.translatable_type = 'Author'
          AND mst_name.locale = ?
          AND mst_name.key = 'name'
        LEFT JOIN
          mobility_string_translations mst_firstname
          ON a.id = mst_firstname.translatable_id
          AND mst_firstname.translatable_type = 'Author'
          AND mst_firstname.locale = ?
          AND mst_firstname.key = 'firstname'
        LEFT JOIN
          mobility_string_translations mst_description
          ON a.id = mst_description.translatable_id
          AND mst_description.translatable_type = 'Author'
          AND mst_description.locale = ?
          AND mst_description.key = 'description'
        LEFT JOIN
          mobility_string_translations mst_link
          ON a.id = mst_link.translatable_id
          AND mst_link.translatable_type = 'Author'
          AND mst_link.locale = ?
          AND mst_link.key = 'link'
        WHERE
          a.id = ? AND
          a.public IS NOT NULL;
      `;
  }
  private authorsNameSqlQuery(): string {
    return `
      SELECT f_mst.value as firstname, l_mst.value as lastname
      FROM authors a, mobility_string_translations f_mst, mobility_string_translations l_mst
      WHERE
        a.id = ? AND
        f_mst.locale = ? AND
        f_mst.translatable_type = 'Author' AND
        f_mst.key = 'firstname' AND
        f_mst.translatable_id = a.id AND
        l_mst.locale = ? AND
        l_mst.translatable_type = 'Author' AND
        l_mst.key = 'name' AND
        l_mst.translatable_id = a.id;
    `;
  }
}
