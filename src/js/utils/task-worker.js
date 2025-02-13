import sensource from './sensource.js';
import logger from './logger.js';
import pgClient from './pg-client.js';
import schema from './schema.js';

/**
 * @description Class for doing the actual data migration work
 */
class TaskWorker {

  /**
   * @description Run the task
   * @param {Object} opts - The options for the task
   * @param {String} opts.startDate - Custom start date for the occupancy data query
   * @param {String} opts.endDate - Custom end date for the occupancy data query
   */
  async run(opts={}){
    await this.updateLocations();

    const dataQuery = {
      relativeDate: 'custom',
      dateGroupings: 'hour',
      entityType: 'location'
    }
    if ( opts.startDate ) dataQuery.startDate = opts.startDate;
    if ( opts.endDate ) dataQuery.endDate = opts.endDate;
    if ( !opts.startDate && !opts.endDate ){
      const lastUpdate = await pgClient.getLastUpdate();
      if ( !lastUpdate ){
        throw new Error('No last update found in PG. Cannot query sensource data without a start date.');
      }
      dataQuery.startDate = lastUpdate.toISOString();
    }
    let occupancy = await sensource.getOccupancyData(dataQuery);
    occupancy = this._parseSensourceOccupancyData(occupancy);

    // if no end date, drop the most recent record for each location in case it's incomplete
    if ( !opts.endDate ){
      const lastHour = occupancy[occupancy.length-1].hour;
      occupancy = occupancy.filter(o => o.hour < lastHour);
    }

    const currentData = await pgClient.getOccupancyData(dataQuery.startDate, dataQuery.endDate);
    const newOccupancy = occupancy.filter(o => !currentData.find(c => c.location_id === o.location_id && c.hour.getTime() === o.hour.getTime()));
    logger.info(`New occupancy data: ${newOccupancy.length} rows`);

    if ( newOccupancy.length ){
      logger.info('Inserting new occupancy data');
      for ( const o of newOccupancy ){
        await pgClient.insertOccupancyData(o);
      }
    } else {
      logger.info('No new occupancy data to insert');
    }

    logger.info('Task complete');
  }

  _parseSensourceOccupancyData(data){
    const parsedArr = [];
    for ( const d of data ){
      const parsed = schema.sensourceToPg('occupancy', 'occupancy', d);
      parsed.hour = new Date(parsed.hour);
      parsed.occupancy_avg = parseInt(parsed.occupancy_avg);
      parsedArr.push(parsed);
    }
    parsedArr.sort((a,b) => a.hour - b.hour);
    return parsedArr;
  }

  /**
   * @description Update the locations in the occupancy.location table from Sensource locations
   */
  async updateLocations(){
    logger.info('Updating locations');

    const senLocations = await sensource.getLocations();
    const pgLocations = await pgClient.getLocations();

    for ( let senLocation of senLocations ){
      const location = schema.sensourceToPg('occupancy', 'location', senLocation);
      const pgLocation = pgLocations.find(l => l.location_id === location.location_id);
      if ( !pgLocation ){
        await pgClient.insertLocation(location);
      } else {
        if ( pgLocation.updated_at < new Date(location.src_updated_at) ){
          await pgClient.updateLocation(location);
        } else {
          logger.info('Location is up to date', {data: {location_id: location.location_id, name: location.name}});
        }
      }
    }
    logger.info('Updated locations');
  };

}

export default new TaskWorker();
