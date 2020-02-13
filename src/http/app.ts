import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { authMiddleware } from './middlewares/auth';

import { container } from '../container';
import controllers from './controllers';
import { Http } from './decorators/http';
import { containerMiddleware, destroyContainerMiddleware } from './middlewares/container';
import { exceptionMiddleware } from './middlewares/exception';
import { isLocal } from '../config';

const app = express();
app.use(cors());
if (isLocal) {
  app.use(morgan('combined'));
}

app.use('/module/firebaseui', express.static('./node_modules/firebaseui'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(containerMiddleware(container));
app.use(authMiddleware());
app.use(Http.controllers(controllers, {
  resolveController: (req, type) => req.container.resolve(type),
}));

app.use(exceptionMiddleware());
app.use(destroyContainerMiddleware());

export { app };
