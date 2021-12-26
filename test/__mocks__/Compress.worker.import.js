/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { workerData } = require('worker_threads');

require('ts-node').register();
// Need to overwrite default cwd behavior for worker threads
process.cwd = () => workerData.cwd;
require(path.resolve(__dirname, '../../src/Compress.worker.ts'));
