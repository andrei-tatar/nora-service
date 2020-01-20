import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as morgan from 'morgan';

import { authMiddleware } from './middlewares/auth';

import { container } from '../container';
import controllers from './controllers';
import { Http } from './decorators/http';
import { containerMiddleware, destroyContainerMiddleware } from './middlewares/container';
import { exceptionMiddleware } from './middlewares/exception';

const app = express();
app.use(cors());
app.use(morgan('combined'));
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
