/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

require('ts-node').register();
require(path.resolve(__dirname, '../../src/Compress.worker.ts'));
