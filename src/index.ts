import 'reflect-metadata';

import { createServer } from 'http';
import { port } from './config';
import { container } from './container';
import { app } from './http/app';
import { initWebSocketListener } from './socket';

const server = createServer(app);
initWebSocketListener(server, container);
server.listen(port, () => console.log(`listening on ${port}`));
