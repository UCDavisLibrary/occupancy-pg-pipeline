CREATE SCHEMA IF NOT EXISTS occupancy;

CREATE TABLE IF NOT EXISTS occupancy.location (
  location_id varchar(255) PRIMARY KEY,
  name text NOT NULL,
  description text,
  country text,
  city text,
  postal_code text,
  state text,
  street text,
  latitude double precision,
  longitude double precision,
  timezone text,
  src_created_at timestamp NOT NULL,
  src_updated_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupancy.occupancy (
  location_id varchar(255) NOT NULL,
  hour timestamp NOT NULL,
  traffic_in integer,
  traffic_out integer,
  occupancy_max integer,
  occupancy_min integer,
  occupancy_avg integer,
  created_at timestamp NOT NULL DEFAULT now(),
  FOREIGN KEY (location_id) REFERENCES occupancy.location(location_id),
  PRIMARY KEY (location_id, hour)
);

DROP VIEW IF EXISTS api.location;
CREATE VIEW api.location AS
SELECT * FROM occupancy.location;

DROP VIEW IF EXISTS api.occupancy;
CREATE VIEW api.occupancy AS
SELECT * FROM occupancy.occupancy;

DROP VIEW IF EXISTS public.location;
CREATE VIEW public.location AS
SELECT * FROM occupancy.location;

DROP VIEW IF EXISTS public.occupancy;
CREATE VIEW public.occupancy AS
SELECT * FROM occupancy.occupancy;
