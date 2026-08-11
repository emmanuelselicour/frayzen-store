import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let app: any;
try {
  const server = require('../dist/server.cjs');
  app = server.default || server;
} catch (e) {
  const server = require('../server');
  app = server.default || server;
}

export default app;

