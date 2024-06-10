import { tsImport } from 'tsx/esm/api';
import { workerData } from 'worker_threads';

process.cwd = () => workerData.cwd;
await tsImport('../../src/Compress.worker.ts', import.meta.url);
