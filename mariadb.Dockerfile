# mariadb.Dockerfile - instructions to build Docker image with mariaDB and load dump from zitat-service.de
#
FROM mariadb
RUN mkdir -p /docker-entrypoint-initdb.d /database
ADD database /database
RUN cp /database/dumps/quote_development.sql.gz /docker-entrypoint-initdb.d/quote_development.sql.gz
CMD ["mariadbd"]
