import express from 'express';
import config from './utils/config.js';
import task from './utils/task.js';
import logger from './utils/logger.js';
import pgClient from './utils/pg-client.js';

const app = express();

if ( !config.cron.idleAtStartup ){
  task.start();
}

app.get('/status' , (req, res) => {
  res.json({
    status: task.status
  });
});

app.post('/start', (req, res) => {
  return res.json(task.start());
});

app.post('/stop', (req, res) => {
  return res.json(task.stop());
});

app.post('/run', async (req, res) => {
  let input = Object.assign({}, req.query, req.body);
  let result = await task.run(input);
  return res.json(result);
});

app.post('/execute-sql-file', async (req, res) => {
  let input = Object.assign({}, req.query, req.body);
  let result = await pgClient.executeFile(input.file);
  return res.json(result);
});

app.listen(config.serverPort, () => {
  logger.info(`Server listening on port ${config.serverPort}`);
});
