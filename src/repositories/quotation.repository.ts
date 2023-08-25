import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MariaDbDataSourceDataSource} from '../datasources';
import {Quotation, QuotationRelations} from '../models';

/* maybe later refactored if needed elsewhere too */
export interface QuotationFilter {
  language: string;
  authorId?: number;
  categoryId?: number;
  userId?: number;
}

export class QuotationRepository extends DefaultCrudRepository<
  Quotation,
  typeof Quotation.prototype.id,
  QuotationRelations
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSourceDataSource,
  ) {
    super(Quotation, dataSource);
  }

  async findQuotation(filter: QuotationFilter): Promise<Quotation[]> {
    const params: (string | number)[] = [filter.language];
    let sqlQuery = `
    SELECT q.id, q.quotation, q.source, q.source_link as sourceLink, q.author_id as authorId
    FROM quotations q, categories_quotations cq
    WHERE q.locale = ? `;
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
