import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MariaDbDataSourceDataSource} from '../datasources';
import {Author, AuthorRelations} from '../models';

/* maybe later refactored if needed elsewhere too */
export interface AuthorFilter {
  locale: string;
  offset: number;
  limit: number;
  name?: string;
  firstname?: string;
  description?: string;
  nfd?: string; // "name, firstname, description"
}

export class AuthorsRepository extends DefaultCrudRepository<
  Author,
  typeof Author.prototype.id,
  AuthorRelations
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSourceDataSource,
  ) {
    super(Author, dataSource);
  }

  // WARNING fallback :en is not implemented
  async findAuthors(filter: AuthorFilter): Promise<Author[]> {

    const params = new Array(4).fill(filter.locale);

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

    params.push(filter.offset ?? 0, filter.limit ?? 10);

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
        a.public IS NOT NULL AND
        ${filterName}
        ${filterFirstname}
        ${filterDescription}
        '1' = '1'
      ORDER BY
        mst_name.value ASC
      LIMIT ?, ?;
    `;
    // console.log(sqlQuery);
    // console.log(params);
    return this.dataSource.execute(sqlQuery, params);
  }

}
