FROM node:22

RUN mkdir /app
WORKDIR /app

RUN apt update && apt install -y \
    vim \
    apt-transport-https \
    ca-certificates \
    gnupg \
    curl \
    lsb-release

# prep for postgres
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
RUN curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

RUN apt-get update && apt-get install -y \
  postgresql-client

COPY src/package.json /app
COPY src/package-lock.json /app
RUN npm install

COPY src/js /app/js
COPY src/sql /app/sql

CMD ["node", "js/server.js"]
