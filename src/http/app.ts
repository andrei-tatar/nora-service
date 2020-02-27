import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { authMiddleware } from './middlewares/auth';

import { isLocal } from '../config';
import { container } from '../container';
import controllers from './controllers';
import { Http } from './decorators/http';
import { containerMiddleware, destroyContainerMiddleware } from './middlewares/container';
import { exceptionMiddleware } from './middlewares/exception';

const app = express();
app.use(cors());
if (isLocal) {
  app.use(morgan('combined'));
} else {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
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
