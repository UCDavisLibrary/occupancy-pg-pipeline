import PG from 'pg';
import config from './config.js';
import logger from './logger.js';
import fs from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';
import path from 'path';

import sqlUtils from './sql-utils.js';

/**
 * @description Class for interacting with the PG database
 */
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
   * @description Get the locations from the occupancy.location table
   * @returns {Array} - Array of locations
   */
  async getLocations(){
    const sql = `
      SELECT * FROM occupancy.location
    `;
    logger.info('Getting locations from PG', {sql});
    const result = await this.pool.query(sql);
    logger.info(`Got ${result.rows.length} locations from PG`);
    return result.rows;
  };

  /**
   * @description Insert a location into the occupancy.location table
   * @param {Object} location - The location object to insert. see schema.js for structure
   * @returns
   */
  async insertLocation(location){
    location.created_at = new Date();
    location.updated_at = new Date();
    const data = sqlUtils.prepareObjectForInsert(location);
    const sql = `
      INSERT INTO occupancy.location (${data.keysString})
      VALUES (${data.placeholdersString})
      RETURNING *
    `;
    logger.info('Inserting location into PG', {sql, values: data.values});
    const result = await this.pool.query(sql, data.values);
    logger.info('Inserted location into PG', {location: result.rows[0]});
    return result.rows[0];
  }

  /**
   * @description Patches a location in the occupancy.location table
   * @param {Object} location - The location object to update. see schema.js for structure. Must include location_id
   */
  async updateLocation(location){
    location.updated_at = new Date();
    const id = location.location_id;
    const data = sqlUtils.prepareObjectForUpdate(location, {excludeFields: ['location_id']});
    const sql = `
      UPDATE occupancy.location
      SET ${data.sql}
      WHERE location_id=$${data.values.length+1}
    `
    logger.info('Updating location in PG', {sql, values: [...data.values, id]});
    await this.pool.query(sql, [...data.values, id]);
    logger.info('Updated location in PG');
  }

  /**
   * @description Get occupancy data from the occupancy.occupancy table
   * @param {String} startDate - Start date for data query. Optional
   * @param {String} endDate - End date for data query. Optional
   * @returns
   */
  async getOccupancyData(startDate, endDate){
    let sql = `
      SELECT * FROM occupancy.occupancy
    `;
    const values = [];
    if (startDate && endDate) {
      sql += ` WHERE hour BETWEEN $1 AND $2`;
      values.push(startDate, endDate);
    } else if (startDate) {
      sql += ` WHERE hour >= $1`;
      values.push(startDate);
    } else if (endDate) {
      sql += ` WHERE hour <= $1`;
      values.push(endDate);
    }
    logger.info('Getting occupancy data from PG', {sql, values});
    const result = await this.pool.query(sql, values);
    logger.info(`Got ${result.rows.length} occupancy records from PG`);
    return result.rows;
  }

  /**
   * @description Get the last datetime that we have occupancy data for
   * @returns {Date} - The last datetime
   */
  async getLastUpdate(){
    const sql = `SELECT MAX(created_at) as last_update FROM occupancy.occupancy`;
    logger.info('Getting last update from PG', {sql});
    const result = await this.pool.query(sql);
    logger.info('Got last update from PG', {last_update: result.rows[0].last_update});
    return result.rows[0].last_update;
  }

  /**
   * @description Insert occupancy data into the occupancy.occupancy table
   * @param {Object} data - The occupancy data object to insert. see schema.js for structure
   * @returns
   */
  async insertOccupancyData(data){
    data = sqlUtils.prepareObjectForInsert(data);
    const sql = `
      INSERT INTO occupancy.occupancy (${data.keysString})
      VALUES (${data.placeholdersString})
      RETURNING *
    `;
    const result = await this.pool.query(sql, data.values);
    return result.rows[0];
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


  /**
   * @description Execute an SQL file in the sql project directory
   * @param {String} file - The name of the file to execute
   * @returns {Object} - Object with status or error key
   */
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
