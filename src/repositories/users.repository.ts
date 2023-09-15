import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {NO_USER_ENTRY, Paging, PagingFilter, UsersPaged} from '../common';
import {MariaDbDataSource} from '../datasources';
import {User} from '../models';

export class UsersRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id
> {
  constructor(
    @inject('datasources.MariaDB_DataSource') dataSource: MariaDbDataSource,
    // @inject(MY_WINSTON_LOGGER) private logger: WinstonLogger
  ) {
    super(User, dataSource);
  }

  /**
   * Get paged list of users.
   * @param filter – starting
   * @returns
   */
  async findUsersWithQuotations(filter: PagingFilter): Promise<UsersPaged> {

    const params: (string | number)[] = [filter.starting ? filter.starting + '%' : '%%'];

    // execute count query
    const totalCountResult = await this.dataSource.execute(this.countSqlQuery(), params);
    // extend params with paging parameters and execute the main query
    params.push(((filter.page - 1) * filter.size), filter.size);
    const users = await this.dataSource.execute(this.mainSqlQuery(), params);

    return {
      paging: this.constructPaging(filter, totalCountResult[0].totalCount),
      users: users
    };
  }

  /**
   * Get users login name for given identifier.
   *
   * @param id unique identiefier (users.id)
   * @returns users entry login name (users.login) or "no user entry"
   */
  async loginName(id: number): Promise<string> {
    const sqlQuery = `
      SELECT login
      FROM users
      WHERE id = ?;
    `;
    const [result] = await this.dataSource.execute(sqlQuery, [id]) as {login: string}[];

    if (!result) {
      return NO_USER_ENTRY;
    }
    // this.logger.log('debug', `found user ${result.login} for ID ${id}`)
    return result.login;
  }

  private constructPaging(filter: PagingFilter, totalCount: number): Paging {
    return {
      totalCount,
      page: filter.page,
      size: filter.size,
      ...(filter.starting && {starting: filter.starting})
    };
  }
  private mainSqlQuery(): string {
    return `
      SELECT users.id, users.login
      FROM users
      INNER JOIN quotations ON users.id = quotations.user_id
      WHERE users.login LIKE ? AND
      quotations.public = 1
      GROUP BY users.id
      ORDER BY users.login ASC
      LIMIT ?, ?;
    `;
  }
  private countSqlQuery(): string {
    return `
      SELECT COUNT(DISTINCT users.id) as totalCount
      FROM users
      INNER JOIN quotations ON users.id = quotations.user_id
      WHERE users.login LIKE ? AND
      quotations.public = 1;
    `;
  }
}
