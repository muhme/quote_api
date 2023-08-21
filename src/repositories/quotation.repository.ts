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

    const sqlQuery = `
    SELECT q.id, q.quotation, q.source, q.source_link as sourceLink, q.author_id as authorId
    FROM quotations q
    WHERE q.locale = ?
    ORDER BY RAND()
    LIMIT 1;
    `;
    // console.log(sqlQuery);
    // console.log(params);
    return this.dataSource.execute(sqlQuery, [filter.language]);
  }

}
