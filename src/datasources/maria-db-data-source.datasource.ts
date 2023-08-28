import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'MariaDB_DataSource',
  connector: 'mysql',
  // mysql://user:password@host/database
  url: process.env.DB_URL ?? 'mysql://quote_development:quote_development@mariadb/quote_development',
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MariaDbDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'MariaDB_DataSource';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.MariaDB_DataSource', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
