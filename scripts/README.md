# Scripts for a more pleasant and also faster development

These scripts support the development and testing of the OpenAPI for [api.zitat-service.de](https://api.zitat-service.de) (see [../README.md](../README.md)).

| Script                         | Description                                                                                  | Comment                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [scripts/create.sh](create.sh) | Delete the three Docker containers and the directory `./dist`. Build and run the containers. | - with optional argument `build` an `docker compose build --no-cache` is executed in advance |
| [scripts/test.sh](test.sh)     | Run the tests.                                                                               |                                                                                              |
| [scripts/clean.sh](clean.sh)   | Removes all quote*api*\* Docker containers and directory `./dist`.                           |
