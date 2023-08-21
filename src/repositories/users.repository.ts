import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {Paging, PagingFilter, UsersPaged} from '../common/types';
import {MariaDbDataSourceDataSource} from '../datasources';
import {User} from '../models';

export class UsersRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSourceDataSource,
  ) {
    super(User, dataSource);
  }

  async findUsersWithQuotations(filter: PagingFilter): Promise<UsersPaged> {
    const sqlQuery = `
      SELECT users.id, users.login
      FROM users
      INNER JOIN quotations ON users.id = quotations.user_id
      WHERE users.login LIKE ?
      GROUP BY users.id
      ORDER BY users.login ASC
      LIMIT ?, ?;
    `;
    const countQuery = `
      SELECT COUNT(DISTINCT users.id) as totalCount
      FROM users
      INNER JOIN quotations ON users.id = quotations.user_id
      WHERE users.login LIKE ?;
    `;

    const searchPattern = filter.starting ? filter.starting + '%' : '%%';
    const params = [searchPattern, (filter.page - 1) * filter.size, filter.size];
    const countParams = [searchPattern];

    // execute the two queries
    const users = await this.dataSource.execute(sqlQuery, params);
    const totalCountResult = await this.dataSource.execute(countQuery, countParams);
    const totalCount = totalCountResult[0].totalCount; // extracting totalCount from the result

    const paging: Paging = {
      totalCount: totalCount,
      page: filter.page,
      size: filter.size,
    };
    if (filter.starting) {
      paging.starting = filter.starting;
    }
    return {
      paging: paging,
      users: users
    };
  }
}
