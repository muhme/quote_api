import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'MariaDB_DataSource',
  connector: 'mysql',
  url: 'mysql://quote_development:quote_development@mariadb/quote_development',
  host: 'mariadb',
  port: 0,
  user: 'quote_development',
  password: 'quote_development',
  database: 'quote_development'
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MariaDbDataSourceDataSource extends juggler.DataSource
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
