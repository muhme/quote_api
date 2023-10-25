# mariadb.Dockerfile - instructions to build Docker image with mariaDB and load dump from zitat-service.de
#
# Oct 25 2023 fall-back to LTS with 10.11.5 has latest (acutal 11.1.2) has problem mysqld: command not found
FROM mariadb:10.11.5
RUN mkdir -p /docker-entrypoint-initdb.d /database
ADD database /database
RUN cp /database/dumps/quote_development.sql.gz /docker-entrypoint-initdb.d/quote_development.sql.gz
CMD ["mysqld"]
