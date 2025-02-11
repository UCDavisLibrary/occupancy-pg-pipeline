import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

class Config {

  constructor(){

    // get version from package file
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(
      readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), 'utf-8')
    );
    this.version = pkg.version;

    // port express server runs on in the container
    this.serverPort = this.getEnv('APP_SERVER_PORT', 3000);

    this.cron = {
      schedule: this.getEnv('APP_CRON_SCHEDULE', '0 4 * * *'),
      timezone: this.getEnv('APP_CRON_TIMEZONE', 'America/Los_Angeles'),
      idleAtStartup: this.getEnv('APP_CRON_IDLE_AT_STARTUP', false)
    }

    this.sensource = {
      clientId: this.getEnv('APP_SENSOURCE_API_CLIENT_ID'),
      clientSecret: this.getEnv('APP_SENSOURCE_API_CLIENT_SECRET'),
      authUrl: this.getEnv('APP_SENSOURCE_API_AUTH_URL', 'https://auth.sensourceinc.com/oauth/token'),
      apiUrl: this.getEnv('APP_SENSOURCE_API_URL', 'https://vea.sensourceinc.com/api')
    }

    this.gc = {}

    this.logger = {
      name: this.getEnv('APP_LOGGER_NAME', 'occupancy-pg-pipeline'),
      streams: this.toArray( this.getEnv('APP_LOGGER_STREAM', 'console,gc') ),
      level: this.getEnv('APP_LOGGER_LEVEL', 'info')
    }

    this.pg = {
      host: this.getEnv('APP_PG_HOST', 'pgfarm.library.ucdavis.edu'),
      pgFarmUrl: this.getEnv('APP_PG_FARM_URL', 'https://pgfarm.library.ucdavis.edu'),
      port: this.getEnv('APP_PG_PORT', 5432),
      database: this.getEnv('APP_PG_DATABASE', 'library/occupancy'),
      user: this.getEnv('APP_PG_USER', 'occupancy-db-service-account'),
      passwordFile: this.getEnv('APP_PG_PASSWORD_FILE', '/secrets/pg-farm-service-account-creds.txt')
    }
  }

  /**
   * @description Get an environment variable.  If the variable is not set, return the default value.
   * @param {String} name - The name of the environment variable.
   * @param {*} defaultValue - The default value to return if the environment variable is not set.
   * @returns
   */
  getEnv(name, defaultValue=false){
    const env = process?.env?.[name]
    if ( env ) {
      if ( env.toLowerCase() == 'true' ) return true;
      if ( env.toLowerCase() == 'false' ) return false;
      return env;
    }
    return defaultValue;
  }

  toArray(str){
    if ( !str ) return [];
    return str.split(',').map( s => s.trim() );
  }
}

export default new Config();
