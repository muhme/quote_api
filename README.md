# api.zitat-service.de

This will be the new API for [zitat-service.de](https://www.zitat-service.de)

## Docker Containers

There is a Docker test and development environment prepared. You can create your own test and development instance with the following commands:

```
$ git clone https://github.com/muhme/quote_api
$ cd quote_api
$ docker compose up -d
```

Then you should have three containers running:

```
$ docker ps
IMAGE                        PORTS                        NAMES
quote_api-nodeapp            0.0.0.0:3000->3000/tcp       quote_api_nodeapp
phpmyadmin/phpmyadmin        0.0.0.0:3001->80/tcp         quote_api_mysqladmin
quote_api-mariadb            0.0.0.0:3002->3306/tcp       quote_api_mariadb
```

- quote_api_mariadb – MariaDB database server
  - admin user is root/root
  - internal database port 3306 is mapped to host's port 3002
  ```sh
    host $ mysql -h localhost -P 3002 -u quote_development -pquote_development
  ```
  - Database quote_development
    - user quote_development/quote_development
    - contains cleaned live database import from August 2023
- quote_api_mysqladmin – phpMyAdmin (user root/root)
  - http://localhost:3001
- quote_api_nodeapp – Node.JS LoopBack4 application for api.zitat-service
  - http://localhost:3000
  - there you have OpenAPI spec and the API explorer

## Tests

Acceptance, unit and integration tests exist only as examples. But more than 100 end-to-end tests are existing. Go into quote_api_nodeapp container first and then run all the tests:

```sh
host $ docker exec -it quote_api_nodeapp /bin/bash
node $ npm run test
```

### K6

There is a script for load testing with [K6](https://k6.io/). This runs (at the moment) endpoint /quote with:

- 100% test cases with language parameter, with 90% randomly using one of the available languages and 10% not using the parameter
- 33% of 100% userId parameter, with 50% randomly using one of the existing user IDs and 50% not using the parameter
- 33% of 100% authorId parameter, with 50% randomly using one of the existing author IDs and 50% not using the parameter
- 33% of 100% categoryId parameter, with 50% randomly using one of the existing category IDs and 50% not using the parameter

```sh
host $ cd src/__tests__/k6
host $ k6 -u 20 -d 20s run script.js
```

## History

- 8/2023 application was initial generated by using [LoopBack 4 CLI](https://loopback.io/doc/en/lb4/Command-line-interface.html) with the
  [initial project layout](https://loopback.io/doc/en/lb4/Loopback-application-layout.html)

[![LoopBack](<https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png>)](http://loopback.io/)

## Contact

Please, don't hesitate to ask if you have any questions or comments.
