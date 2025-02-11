import sensource from './sensource.js';
import logger from './logger.js';

class TaskWorker {

  async updateLocations(){
    logger.info('Updating locations');

    logger.info('Getting locations from Sensource');
    const locations = await sensource.getLocations();
    logger.info(`Got ${locations.length} locations from Sensource`);
  };

}

export default new TaskWorker();
