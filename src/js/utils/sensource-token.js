import config from "./config.js";
import fetch from 'node-fetch';
import logger from './logger.js';

/**
 * @description Retrieves and caches temporary token for accessing Sensource (gatecount) API
 */
class SensourceToken {

  constructor(){

    this.lastResponse = {};
    this.refreshBuffer = 30; // seconds

    this._promise = null;
  };

  isExpired(){
    const expiresIn = this.lastResponse?.expires_in;
    if ( !expiresIn ) return true;
    const expiresAt = this.lastResponse.created_at + (expiresIn * 1000) - (this.refreshBuffer * 1000);
    const isExpired = Date.now() > expiresAt;
    if ( isExpired ){
      logger.info('Sensource token expired', {data: {createdAt: this.lastResponse.created_at, expiresAt}});
    }
    return isExpired;
  }

  async get(){
    if ( this.isExpired() ){
      if ( !this._promise ){
        this._promise = this._get();
      }
      await this._promise;
      this._promise = null;
    }
    return this.lastResponse.access_token;
  }

  async _get(){
    logger.info('Getting Sensource token');
    const response = await fetch(config.sensource.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: config.sensource.clientId,
        client_secret: config.sensource.clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if ( !response.ok ){
      throw new Error(`Error getting Sensource token: ${response.status} ${response.statusText}`);
    }

    logger.info('Got Sensource token');
    this.lastResponse = await response.json();
    this.lastResponse.created_at = Date.now();

    return this.lastResponse.access_token;
  }

}

export default new SensourceToken();
