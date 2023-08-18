import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MariaDbDataSourceDataSource} from '../datasources';
import {User, UserRelations} from '../models';

/* maybe later refactored if needed elsewhere too */
export interface UserFilter {
  offset: number;
  limit: number;
  starting?: string;
}

export class UsersRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSourceDataSource,
  ) {
    super(User, dataSource);
  }

  async findUsersWithQuotations(filter: UserFilter): Promise<User[]> {
    const sqlQuery = `
      SELECT users.id, users.login
      FROM users
      INNER JOIN quotations ON users.id = quotations.user_id
      WHERE users.login LIKE ?
      GROUP BY users.id
      ORDER BY users.login ASC
      LIMIT ?, ?;
    `;

    if (!filter.starting) {
      filter.starting = '%';
    }

    const params = [filter.starting + '%', filter.offset ?? 0, filter.limit ?? 10];

    return this.dataSource.execute(sqlQuery, params);
  }

}
