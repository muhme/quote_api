import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MariaDbDataSourceDataSource} from '../datasources';
import {Category, CategoryRelations} from '../models';

/* maybe later refactored if needed elsewhere too */
export interface CategoryFilter {
  locale: string;
  offset?: number;
  limit?: number;
  starting?: string;
}

export class CategoriesRepository extends DefaultCrudRepository<
  Category,
  typeof Category.prototype.id,
  CategoryRelations
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSourceDataSource,
  ) {
    super(Category, dataSource);
  }

  async findCategories(filter: CategoryFilter): Promise<Category[]> {
    const sqlQuery = `
      SELECT DISTINCT
        c.id,
        COALESCE(t.value, t_default.value) AS value
      FROM
        categories c
      LEFT JOIN
        mobility_string_translations t ON c.id = t.translatable_id
        AND t.translatable_type = 'Category'
        AND t.locale = ?
        AND t.key = 'category'
      LEFT JOIN
        mobility_string_translations t_default ON c.id = t_default.translatable_id
        AND t_default.translatable_type = 'Category'
        AND t_default.locale = 'en'
        AND t_default.key = 'category'
      WHERE
        COALESCE(t.value, t_default.value) LIKE ?
      ORDER BY
        COALESCE(t.value, t_default.value) ASC
      LIMIT ?, ?;
    `;

    if (!filter.starting) {
      filter.starting = '%';
    }

    const params = [filter.locale, filter.starting + '%', filter.offset ?? 0, filter.limit ?? 10];

    return this.dataSource.execute(sqlQuery, params);
  }

}
