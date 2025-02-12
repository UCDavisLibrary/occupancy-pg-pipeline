This repo is in progress....



# Database Setup

- Create database in pgfarm
- Add yourself as an admin user
- Create a service account in pgfarm. name must be unique to all keycloak.
- Update grant type of service account `pgfarm database set-access schema library/occupancy _ occupancy-db-service-account WRITE`
- ensure service account exists
- save service account password
- give service account write access to api schema: ` pgfarm database set-access schema library/occupancy api occupancy-db-service-account WRITE`
- and public schema ` pgfarm database set-access schema library/occupancy public occupancy-db-service-account WRITE`
- run `node ./js/cli.js execute-sql-file 000-init.sql`
- do initial dataload. will likely need to several batched calls `node ./js/cli.js run -w -s '2024-09-01' -e '2025-02-01'`
