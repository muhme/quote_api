# using current LTS version, released April 2023
FROM node:20-slim

# like to have some utilities for working
RUN apt-get update && apt-get install -y htop net-tools vim

# use non-root user
USER node

# create app directory
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

# install app dependencies
COPY --chown=node package.json package-lock.json ./
RUN npm install

# bundle app source code
COPY --chown=node . .
RUN npm run build

# bind to all network interfaces so that it can be mapped to the host OS
# other useful ENV variables are:
#   DEBUG=loopback:connector:*
#   NODE_ENV=production
ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=development
EXPOSE ${PORT}

# CMD [ "node", "--trace-warnings", "." ]
CMD [ "node", "." ]
