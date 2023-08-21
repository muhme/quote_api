import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {AuthorFilter, AuthorsFilter, AuthorsPaged, PagingAuthors} from '../common/types';
import {MariaDbDataSourceDataSource} from '../datasources';
import {Author} from '../models';

export class AuthorsRepository extends DefaultCrudRepository<
  Author,
  typeof Author.prototype.id
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSourceDataSource,
  ) {
    super(Author, dataSource);
  }

  async findAuthors(filter: AuthorsFilter): Promise<AuthorsPaged> {

    const params = new Array(4).fill(filter.language);

    // nfd used with "name, firstname, description"?
    if (filter.nfd) {
      [filter.name, filter.firstname, filter.description] = filter.nfd.split(",", 3);
    }
    let filterName = "";
    if (filter.name) {
      filterName = "mst_name.value LIKE ? AND "
      params.push(filter.name + '%');
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
        mst_name.value AS name,
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
        a.public IS NOT NULL
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
        a.public IS NOT NULL
    `;

    // execute count query
    const totalCountResult = await this.dataSource.execute(countQuery, params);
    // extracting totalCount from the result
    const totalCount = totalCountResult[0].totalCount;

    // extend params with paging parameters
    params.push(((filter.page - 1) * filter.size), filter.size);
    // execute the real query
    const authors = await this.dataSource.execute(sqlQuery, params);

    const paging: PagingAuthors = {
      language: filter.language,
      totalCount: totalCount,
      page: filter.page,
      size: filter.size,
    };
    if (filter.name) {
      paging.name = filter.name;
    }
    if (filter.firstname) {
      paging.firstname = filter.firstname;
    }
    if (filter.description) {
      paging.description = filter.description;
    }
    return {
      paging: paging,
      authors: authors
    };
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
        mst_name.value AS name,
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

    return this.dataSource.execute(sqlQuery, params);
  }

}
