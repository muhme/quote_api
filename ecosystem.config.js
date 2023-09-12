module.exports = {
  apps: [
    {
      name: 'quote_api',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      output: '/dev/null',
      error: '/dev/null',
      log: 'combined.log', // stdout+stderr
      // log_date_format: 'YYMMDD HH:mm:ss.SSS',
    },
  ],
};
