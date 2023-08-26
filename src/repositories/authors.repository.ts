import {inject} from '@loopback/core';
import {LoggingBindings, WinstonLogger} from '@loopback/logging';
import {DefaultCrudRepository} from '@loopback/repository';
import {AuthorFilter, AuthorsFilter, AuthorsPaged, PagingAuthors} from '../common/types';
import {MariaDbDataSourceDataSource} from '../datasources';
import {Author} from '../models';

export class AuthorsRepository extends DefaultCrudRepository<
  Author,
  typeof Author.prototype.id
> {
  constructor(
    // @loopback/logging winston logger
    @inject(LoggingBindings.WINSTON_LOGGER) private logger: WinstonLogger,
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSourceDataSource
  ) {
    super(Author, dataSource);
  }

  async findAuthors(filter: AuthorsFilter): Promise<AuthorsPaged> {

    const params = new Array(4).fill(filter.language);

    // nfd used with "name, firstname, description"?
    if (filter.lfd) {
      [filter.lastname, filter.firstname, filter.description] = filter.lfd.split(",", 3);
    }
    let filterName = "";
    if (filter.lastname) {
      filterName = "mst_name.value LIKE ? AND "
      params.push(filter.lastname + '%');
    }
    let filterFirstname = "";
    if (filter.firstname) {
      filterFirstname = "mst_firstname.value LIKE ? AND "
      params.push(filter.firstname + '%');
    }
    let filterDescription = "";
    if (filter.description) {
      filterDescription = "mst_description.value LIKE ? AND "
      params.push(filter.description + '%');
    }

    const sqlQuery = `
    SELECT DISTINCT
        a.id,
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
        ${filterName}
        ${filterFirstname}
        ${filterDescription}
        a.public = 1
      ORDER BY
        mst_name.value ASC
      LIMIT ?, ?;
    `;
    const countQuery = `
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
        ${filterName}
        ${filterFirstname}
        ${filterDescription}
        a.public = 1
    `;

    // execute count query
    const totalCountResult = await this.dataSource.execute(countQuery, params);
    // extracting totalCount from the result
    const totalCount = totalCountResult[0].totalCount;

    // extend params with paging parameters
    params.push(((filter.page - 1) * filter.size), filter.size);
    // execute the real query
    let authors = await this.dataSource.execute(sqlQuery, params);

    const paging: PagingAuthors = {
      language: filter.language,
      totalCount: totalCount,
      page: filter.page,
      size: filter.size,
    };
    if (filter.lastname) {
      paging.lastname = filter.lastname;
    }
    if (filter.firstname) {
      paging.firstname = filter.firstname;
    }
    if (filter.description) {
      paging.description = filter.description;
    }

    // exclude all null attributes from OpenAPI output
    // create name from firstname and lastname
    authors = this.washAuthorsAttributes(authors, filter.language);

    return {
      paging: paging,
      authors: authors
    };
  }
  // exclude all null attributes from OpenAPI output
  // create name from firstname and lastname
  washAuthorsAttributes(authors: Author[], language: string): Author[] {
    for (const author of authors) {

      if (author.firstname === null) author.firstname = undefined;
      if (author.lastname === null) author.lastname = undefined;
      if (author.description === null) author.description = undefined;
      if (author.link === null) author.link = undefined;

      author.name = this.combineAuthorName(author.firstname, author.lastname, language);

    }
    return authors;
  }

  combineAuthorName(firstname: string | undefined, lastname: string | undefined, language: string): string {
    firstname = firstname ?? "";
    lastname = lastname ?? "";
    let name;
    if (language === "ja") {
      if (lastname && firstname) {
        name = `${lastname}・${firstname}`;
      } else {
        name = lastname || firstname;
      }
    } else {
      if (firstname && lastname) {
        name = `${firstname} ${lastname}`;
      } else {
        name = firstname || lastname;
      }
    }
    return name;
  }

  /**
   * get Author by ID
   *
   * @param locale, id
   * @returns Author
   */
  async findAuthor(filter: AuthorFilter): Promise<Author[]> {

    const params = new Array(4).fill(filter.language);
    params.push(filter.id)

    const sqlQuery = `
    SELECT DISTINCT
        a.id AS id,
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
        a.public IS NOT NULL;`

    let authors = await this.dataSource.execute(sqlQuery, params);

    authors = this.washAuthorsAttributes(authors, filter.language);

    return authors;
  }

  /**
   * Get author name for given identifier in given locale.
   *
   * @param id unique identifier (authors.id)
   * @param language locale for authors name (mobility_string_translations.locale)
   * @returns authors name as e.g. "firstname name" in given locale or "no author entry"
   */
  async authorName(id: number, language: string): Promise<string> {
    const sqlQuery = `
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
    const [result] = await this.dataSource.execute(sqlQuery, [id, language, language]);

    if (!result) {
      return "no author entry";
    }
    const name = this.combineAuthorName(result.firstname, result.lastname, language);
    this.logger.log('debug', `authorName: found name ${name} for ID ${id} in language ${language}`);
    return name;
  }

}
