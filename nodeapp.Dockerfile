# Check out https://hub.docker.com/_/node to select a new base image
FROM node:18-slim

RUN npm install pm2 -g && apt-get update && apt-get install -y htop

# Set to a non-root built-in user `node`
USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/node/app

WORKDIR /home/node/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=node package*.json ./

RUN npm install

# Bundle app source code
COPY --chown=node . .

RUN npm run build

# Bind to all network interfaces so that it can be mapped to the host OS
# other useful ENV variables are:
#   DEBUG=loopback:connector:*
#   NODE_ENV=production
ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=production

EXPOSE ${PORT}

# CMD [ "node", "--trace-warnings", "." ]
CMD [ "node", "." ]
