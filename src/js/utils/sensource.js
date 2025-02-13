import sensourceToken from './sensource-token.js';
import fetch from 'node-fetch';
import logger from './logger.js';
import config from './config.js';

/**
 * @description Class for interacting with Sensource API
 */
class Sensource {

  /**
   * @description Get the locations with gatecounters from the Sensource API
   * @returns {Array} - Array of locations
   */
  async getLocations(){
    logger.info('Getting locations from Sensource');
    const locations = await this._get('location');
    logger.info(`Got ${locations.length} locations from Sensource`);
    return locations;
  }

  /**
   * @description Get the traffic data from the Sensource API
   * @param {Object} query - The query parameters
   * @returns {Array} - Array of traffic data
   */
  async getTrafficData(query){
    if ( !query.metrics) {
      query = {...query, metrics: 'ins,outs'};
    }
    logger.info('Getting traffic data from Sensource', {query});
    let data = await this._get('data/traffic', query);
    if ( data?.messages ){
      logger.info('messages from traffic call to sensource', {messages: data.messages});
    }
    if ( !data?.results?.length ){
      throw new Error('Results array not found in Sensource data');
    }
    data = data.results;
    logger.info('Got traffic data from Sensource', {dataLength: data.length});
    return data;
  }

  /**
   * @description Get the occupancy data from the Sensource API
   * @param {Object} query - The query parameters
   * @returns {Array} - Array of occupancy data
   */
  async getOccupancyData(query){
    if ( !query.metrics) {
      query = {...query, metrics: 'occupancy(max),occupancy(min),occupancy(avg)'};
    }
    logger.info('Getting occupancy data from Sensource', {query});
    let data = await this._get('data/occupancy', query);
    if ( data?.messages?.length  ){
      logger.info('messages from occupancy call to sensource', {messages: data.messages});
    }
    if ( !data?.results ){
      throw new Error('Results array not found in Sensource data');
    }
    data = data.results;
    logger.info('Got occupancy data from Sensource', {dataLength: data.length});
    return data;
  }

  /**
   * @description Fetch data from Sensource API
   * @param {String} path - The path to the API endpoint
   * @param {Object} query - Any url query parameters
   * @param {Object} params - Any additional fetch parameters
   * @returns
   */
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

    logger.info(`Getting Sensource data`, {data: {path, query, url}});
    const response = await fetch(url, params);
    if ( !response.ok ){
      throw new Error(`Error getting Sensource data: ${response.status} ${response.statusText}`);
    }
    logger.info(`Got Sensource data`, {data: {path, query, url}});
    return response.json();
  }

}

export default new Sensource();
