import sensourceToken from './sensource-token.js';
import fetch from 'node-fetch';
import logger from './logger.js';
import config from './config.js';

class Sensource {

  async getLocations(){
    return this._get('location');
  }

  async _get(path, query={}, params={}){
    const token = await sensourceToken.get();
    let url = `${config.sensource.apiUrl}/${path}`;
    if ( Object.keys(query).length > 0 ){
      url += '?' + new URLSearchParams(query);
    }

    if ( !params.headers ){
      params.headers = {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      };
    }

    logger.info(`Getting Sensource data`, {path, query, url});
    const response = await fetch(url, params);
    if ( !response.ok ){
      throw new Error(`Error getting Sensource data: ${response.status} ${response.statusText}`);
    }
    logger.info(`Got Sensource data`, {path, query, url});
    return response.json();
  }

}

export default new Sensource();
