import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {CategoriesPaged, PagingLocale, PagingLocaleFilter} from '../common/types';
import {MariaDbDataSourceDataSource} from '../datasources';
import {Category} from '../models';

export class CategoriesRepository extends DefaultCrudRepository<
  Category,
  typeof Category.prototype.id
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSourceDataSource,
  ) {
    super(Category, dataSource);
  }

  async findCategories(filter: PagingLocaleFilter): Promise<CategoriesPaged> {
    const sqlQuery = `
      SELECT DISTINCT
        c.id,
        t.value AS category
      FROM
        categories c
      LEFT JOIN
        mobility_string_translations t ON c.id = t.translatable_id
        AND t.translatable_type = 'Category'
        AND t.locale = ?
        AND t.key = 'category'
      WHERE
        c.public IS NOT NULL AND
        t.value LIKE ?
      ORDER BY
        t.value ASC
      LIMIT ?, ?;
    `;
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as totalCount
      FROM
        categories c
      LEFT JOIN
        mobility_string_translations t ON c.id = t.translatable_id
        AND t.translatable_type = 'Category'
        AND t.locale = ?
        AND t.key = 'category'
      WHERE
        c.public IS NOT NULL AND
        t.value LIKE ?;
    `;

    const searchPattern = filter.starting ? filter.starting + '%' : '%%';
    const params: (string | number)[] = [filter.language, searchPattern];

    // execute count query
    const totalCountResult = await this.dataSource.execute(countQuery, params);
    // extracting totalCount from the result
    const totalCount = totalCountResult[0].totalCount;

    // extend params with paging parameters
    params.push(((filter.page - 1) * filter.size), filter.size);
    // execute the real query
    const categories = await this.dataSource.execute(sqlQuery, params);

    const paging: PagingLocale = {
      language: filter.language,
      totalCount: totalCount,
      page: filter.page,
      size: filter.size,
    };
    if (filter.starting) {
      paging.starting = filter.starting;
    }
    return {
      paging: paging,
      categories: categories
    };
  }
}
