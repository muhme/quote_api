import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {CategoriesPaged, LANGUAGE_DEFAULT, NO_CATEGORY_ENTRY, PagingLanguage, PagingLanguageFilter} from '../common';
import {MariaDbDataSource} from '../datasources';
import {Category} from '../models';

export class CategoriesRepository extends DefaultCrudRepository<
  Category,
  typeof Category.prototype.id
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSource,
    // @inject(MY_WINSTON_LOGGER) private logger: WinstonLogger
  ) {
    super(Category, dataSource);
  }

  /**
   * get paged list of categories
   * @param filter – starting, language
   * @returns CategoriesPaged
   */
  async findCategories(filter: PagingLanguageFilter): Promise<CategoriesPaged> {

    const searchPattern = filter.starting ? filter.starting + '%' : '%%';
    const params: (string | number)[] = [filter.language, searchPattern];

    // execute count query
    const totalCountResult = await this.dataSource.execute(this.countSqlQuery(), params);

    // extend params with paging parameters and execute the main query
    params.push(((filter.page - 1) * filter.size), filter.size);
    const categories = await this.dataSource.execute(this.mainSqlQuery(), params);

    const paging: PagingLanguage = {
      language: filter.language,
      totalCount: totalCountResult[0].totalCount,
      page: filter.page,
      size: filter.size,
      ...(filter.starting && {starting: filter.starting})
    };

    return {
      paging: paging,
      categories: categories
    };
  }

  /**
   * Get category name for given identifier in given locale.
   *
   * @param id unique identifier (categories.id)
   * @param language locale for the category name (mobility_string_translations.locale) or undefined and default 'en' will be used
   * @returns category name in given locale or "no category entry"
   */
  async categoryName(id: number, language: string | undefined): Promise<string> {
    if (!language) {
      language = LANGUAGE_DEFAULT;
    }
    const sqlQuery = `
        SELECT value as category
        FROM categories c, mobility_string_translations mst
        WHERE
          c.id = ? AND
          mst.locale = ? AND
          mst.translatable_type = 'Category' AND
          mst.key = 'category' AND
          mst.translatable_id = c.id;
      `;
    const [result] = await this.dataSource.execute(sqlQuery, [id, language]) as {category: string}[];

    if (!result) {
      return NO_CATEGORY_ENTRY;
    }
    // this.logger.log('debug', `categoryName: found category ${result.category} for ID ${id} in language ${language}`)
    return result.category;
  }

  private mainSqlQuery(): string {
    return `
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
        c.public = 1 AND
        t.value LIKE ?
      ORDER BY
        t.value ASC
      LIMIT ?, ?;
      `;
  }
  private countSqlQuery(): string {
    return `
      SELECT COUNT(DISTINCT c.id) as totalCount
      FROM
        categories c
      LEFT JOIN
        mobility_string_translations t ON c.id = t.translatable_id
        AND t.translatable_type = 'Category'
        AND t.locale = ?
        AND t.key = 'category'
      WHERE
        c.public = 1 AND
        t.value LIKE ?;
  `;
  }
}
