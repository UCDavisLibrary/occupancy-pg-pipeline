import bunyan from 'bunyan';
import {LoggingBunyan} from '@google-cloud/logging-bunyan';
import config from './config.js';

const streams = [];

if ( config.logger.streams.includes('none') ){
  // do nothing
} else if ( config.logger.streams.includes('stdout') || config.logger.streams.includes('console') ){
  // log to console
  streams.push({ stream: process.stdout });
} else if ( config.logger.streams.includes('gc') && config.gc.serviceAccountExists ){
  // todo google cloud logging
}

let logger = bunyan.createLogger({
  name: config.logger.name,
  level: config.logger.level || 'info',
  streams: streams
});

let info = {
  name: config.logger.name,
  level: config.logger.level || 'info',
  googleCloudLogging : {
    serviceAccountExists : config.gc.serviceAccountExists,
    enabled : config.logger.streams.includes('gc')
  }
}

logger.info('logger initialized', info);

export default logger
