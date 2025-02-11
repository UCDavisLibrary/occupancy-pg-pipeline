import config from './config.js';
import cron from 'node-cron';
import logger from './logger.js';
import taskWorker from './task-worker.js';

class Task {
  constructor(){
    this.status = 'idle';

    this.manualRunning = false;

    // set up the cron task
    this._task = cron.schedule(
      config.cron.schedule,
      () => { this._run(); },
      {
        timezone: config.cron.timezone,
        scheduled: false
      }
    )
  }

  start(){
    if ( this.status === 'running' ){
      return {status: 'currently-running'};
    }
    if ( this.status === 'scheduled' ){
      return {status: 'already-scheduled'};
    }
    this.status = 'scheduled';
    this._task.start();
    logger.info(`Task scheduled: ${config.cron.schedule}`);
    return {status: 'scheduled'};
  }

  stop(){
    if ( this.status === 'idle' ){
      return {status: 'already-idle'};
    }
    this._task.stop();
    this.status = 'idle';
    logger.info('Task stopped');
    return {status: 'idle'};
  }

  async run(opts={}){
    if ( this.manualRunning ) {
      return {status: 'already-running'};
    }
    const task = this._run({...opts, manual: true});
    if ( opts.wait ){
      await task;
      return {status: 'complete'};
    }
    return {status: 'started'};
  }

  async _run(opts={}){
    try {
      if ( opts.manual ){
        if ( this.manualRunning ) return;
        this.manualRunning = true;
      } else {
        this.status = 'running';
      }
      logger.info('Job is running', opts);

      await taskWorker.updateLocations();

    } catch (err) {
      logger.error(err);
    } finally {
      if ( opts.manual ){
        this.manualRunning = false;
      } else {
        this.status = 'scheduled';
      }
    }
  }
}

export default new Task();
