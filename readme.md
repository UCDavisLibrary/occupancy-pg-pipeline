This repo is in progress....



# Database Setup

- Create database in pgfarm
- Add yourself as an admin user
- Create a service account in pgfarm. name must be unique to all keycloak.
- Update grant type of service account `pgfarm database set-access schema library/occupancy _ occupancy-db-service-account WRITE`
- ensure service account exists
- save service account password
