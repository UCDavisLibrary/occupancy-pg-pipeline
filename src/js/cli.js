import { Command } from 'commander';
import config from './utils/config.js';
import fetch from 'node-fetch';

const program = new Command();
program
  .name('occupancy-pg-pipeline')
  .description('CLI for operating the pipeline that moves occupancy data from Sensource to PGFarm');

program.version(config.version);

program.command('start')
  .description('Start the cron task for moving occupancy data')
  .action(async () => {
    try {
      const response = await fetch(`http://localhost:${config.serverPort}/start`, { method: 'POST' });
      if ( !response.ok ) {
        throw new Error(`Error starting task: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data);
    }
    catch (err) {
      console.error(err);
    }
  }
);

program.command('stop')
  .description('Stop the cron task for moving occupancy data')
  .action(async () => {
    try {
      const response = await fetch(`http://localhost:${config.serverPort}/stop`, { method: 'POST' });
      if ( !response.ok ) {
        throw new Error(`Error stopping task: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data);
    }
    catch (err) {
      console.error(err);
    }
  }
);

program.command('status')
  .description('Get the status of the cron task for moving occupancy data')
  .action(async () => {
    try {
      const response = await fetch(`http://localhost:${config.serverPort}/status`);
      if ( !response.ok ) {
        throw new Error(`Error getting status: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data);
    }
    catch (err) {
      console.error(err);
    }
  }
);

program.command('run')
  .description('Run the task immediately')
  .option('-w, --wait', 'Wait for the task to complete before giving a response')
  .option('-s --start <start>', 'Custom start date for occupancy data query. If not provided, will default to last update in PG.')
  .option('-e --end <end>', 'Custom end date for occupancy data query. If not provided, will default to current time.')
  .option('-t --timeout <timeout>', 'Timeout in milliseconds for the task to complete. Default is 10 minutes.')
  .action(async (opts) => {
    try {
      const urlParams = new URLSearchParams();
      if ( opts.wait ) {
        urlParams.append('wait', true);
      }
      if ( opts.start ) {
        urlParams.append('startDate', opts.start);
      }
      if ( opts.end ) {
        urlParams.append('endDate', opts.end);
      }
      if ( opts.timeout ) {
        urlParams.append('timeout', opts.timeout);
      }
      const response = await fetch(`http://localhost:${config.serverPort}/run?${urlParams.toString()}`, { method: 'POST' });
      if ( !response.ok ) {
        throw new Error(`Error running task: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data);
    }
    catch (err) {
      console.error(err);
    }
  }
);

program.command('execute-sql-file')
  .description('Execute a SQL file in the sql container directory')
  .argument('<file>', 'The name of the file to execute')
  .action(async (file) => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append('file', file);
      const response = await fetch(`http://localhost:${config.serverPort}/execute-sql-file?${urlParams.toString()}`, { method: 'POST' });
      if ( !response.ok ) {
        throw new Error(`Error executing SQL file: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data);
    }
    catch (err) {
      console.error(err);
    }
  }
);

program.parse();
