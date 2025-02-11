import PG from 'pg';
import config from './config.js';
import logger from './logger.js';
import fs from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';
import path from 'path';

class PGClient {

  constructor(){

    this.pool = new PG.Pool({
      user: config.pg.user,
      host: config.pg.host,
      database: config.pg.database,
      password: this.getPassword.bind(this),
      port: config.pg.port
    });
    this.pool.on('error', (err) => {
      logger.error('PG client error', err);
    });

    this.serviceAccountCredentials = {};
  }

  /**
   * @description Get the password for the service account, which is a keycloak token.
   * Will get new token if it is expired.
   * Called by the PG.Pool when a new connection is created.
   * @returns {string} - MD5 hash of the service account token
   */
  async getPassword(){
    if ( this.serviceAccountCredentials.expiresAt && (Date.now() + 60 * 1000 * 60) < this.serviceAccountCredentials.expiresAt ){
      return this.serviceAccountCredentials.hash;
    }
    if ( this.serviceAccountCredentials.expiresAt ){
      logger.info('Service account token expired', {expiresAt: this.serviceAccountCredentials.expiresAt});
    }

    if ( !fs.existsSync(config.pg.passwordFile) ){
      logger.error(`Password file not found for pgfarm service account: ${config.pg.passwordFile}`);
      return '';
    }
    const secret = fs.readFileSync(config.pg.passwordFile, 'utf-8').trim();

    const url = `${config.pg.pgFarmUrl}/auth/service-account/login`;
    logger.info('Getting PGFarm service account token', {url, username: config.pg.user});
    let resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: config.pg.user,
        secret
      })
    });
    if ( !resp.ok ){
      logger.error(`Error getting PGFarm service account token: ${resp.status} ${resp.statusText}`);
      return '';
    }
    const body = await resp.json();
    body.expiresAt = Date.now() + (body.expires_in * 1000);
    logger.info('Got PGFarm service account token', {expiresAt: body.expiresAt});
    body.hash = 'urn:md5:'+crypto.createHash('md5').update(body.access_token).digest('base64');
    this.serviceAccountCredentials = body;
    return body.hash;
  }


  async executeFile(file){
    try {
      const p = path.join('/app/sql', file);
      if ( !fs.existsSync(p) ){
        throw new Error(`SQL file not found: ${file}`);
      }
      logger.info(`Executing SQL file: ${file}`);
      const sql = fs.readFileSync(p, 'utf-8').trim();
      await this.pool.query(sql);

    } catch (err) {
      return {error: err.message};
    }
    return {status: 'complete'};
  }
}

export default new PGClient();
