import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {QuoteFilter} from '../common';
import {MariaDbDataSource} from '../datasources';
import {Quotation} from '../models';
import {MyLogger} from '../providers';

export class QuotationRepository extends DefaultCrudRepository<
  Quotation,
  typeof Quotation.prototype.id
> {
  constructor(
    // @loopback/logging winston logger
    @inject('logger') private logger: MyLogger,
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSource
  ) {
    super(Quotation, dataSource);
  }

  /**
   * get one random quote
   * @param filter - language, categoryId, authorId, userId
   * @returns
   */
  async findQuotation(filter: QuoteFilter): Promise<Quotation[]> {
    const params: (string | number)[] = [];
    // only join for categories if needed as this is DB expensive
    const categoriesQuotationsTable =
      (filter.categoryId === undefined) ? "" : ", categories_quotations cq";
    let sqlQuery = `
      SELECT q.id, q.quotation, q.source, q.source_link as sourceLink, q.author_id as authorId, q.locale as language
      FROM quotations q ${categoriesQuotationsTable}
      WHERE q.public = 1 `;
    if (filter.language !== undefined) {
      sqlQuery += ' AND q.locale = ? ';
      params.push(filter.language);
    }
    if (filter.userId !== undefined) {
      sqlQuery += ' AND q.user_id = ? ';
      params.push(filter.userId);
    }
    if (filter.categoryId !== undefined) {
      sqlQuery += ' AND cq.quotation_id = q.id AND cq.category_id = ? ';
      params.push(filter.categoryId);
    }
    if (filter.authorId !== undefined) {
      sqlQuery += ' AND q.author_id = ? ';
      params.push(filter.authorId);
    }
    sqlQuery += ' ORDER BY RAND() LIMIT 1;';

    return this.dataSource.execute(sqlQuery, params);
  }
}
