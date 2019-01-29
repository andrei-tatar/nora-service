import { IRouterHandler, IRouterMatcher, NextFunction, Request, Response, Router } from 'express';
import { Controller } from '../controllers/controller';
import { Param } from './param';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export class Http {
    private static readonly controllerSymbol = Symbol('http:controller');
    private static readonly methodsSymbol = Symbol('http:methods');
    private static readonly filtersSymbol = Symbol('http:filters');

    static controller(route: string) {
        return (target) => {
            Reflect.defineMetadata(Http.controllerSymbol, { route }, target);
        };
    }

    static get(subRoute?: string) {
        return this.registerMethod('get', subRoute);
    }

    static post(subRoute?: string) {
        return this.registerMethod('post', subRoute);
    }

    static put(subRoute?: string) {
        return this.registerMethod('put', subRoute);
    }

    static delete(subRoute?: string) {
        return this.registerMethod('delete', subRoute);
    }

    static filter(filter: Filter) {
        return target => {
            const filters = this.getRegisteredFilters(target);
            filters.push({ filter });
            Reflect.defineMetadata(this.filtersSymbol, filters, target);
        };
    }

    static controllers(controllers: any[], { resolveController }: ControllerOptions) {
        const allRouter = Router();
        for (const controller of controllers) {
            const router = Router();
            const metadata = Reflect.getMetadata(Http.controllerSymbol, controller);
            if (!metadata) { continue; }

            const filters = this.getRegisteredFilters(controller);
            for (const filter of filters) {
                router.use(filter.filter());
            }

            this.registerControllerOnRouter(router, controller, resolveController);
            allRouter.use(metadata.route, router);
        }
        return allRouter;
    }

    private static registerMethod(method: HttpMethod, subRoute: string = '') {
        return (target, key) => {
            const methods = this.getRegisteredMethods(target.constructor);
            methods.push({
                httpMethod: method,
                subRoute,
                controllerMethod: key,
            });
            Reflect.defineMetadata(this.methodsSymbol, methods, target.constructor);
        };
    }

    private static registerControllerOnRouter(router: Router, controller, resolveController: ControllerResolver) {
        const methods = this.getRegisteredMethods(controller);
        for (const method of methods) {
            const methodName = method.controllerMethod;
            const paramsFactory = Param.getParamsFactory(controller, methodName);
            const handler = this.requestHandler.bind(this, async (req: Request) => {
                const controllerInstance = resolveController(req, controller);
                const params = await Promise.all(paramsFactory(req));
                const result = await controllerInstance[methodName].apply(controllerInstance, params);
                return result;
            });
            router[method.httpMethod](method.subRoute, handler);
        }
    }

    private static async requestHandler(
        callControllerMethod: (req: Request) => Promise<any>,
        request: Request, response: Response, next: NextFunction) {
        try {
            const result = await callControllerMethod(request);
            if (result !== void 0) {
                if (typeof result === 'string') {
                    response.contentType('html').send(result);
                } else {
                    response.json(result);
                }
            } else {
                response.end();
            }
            next();
        } catch (err) {
            next(err);
        }
    }

    private static getRegisteredMethods(target) {
        return (Reflect.getMetadata(this.methodsSymbol, target) || []) as {
            httpMethod: HttpMethod;
            subRoute?: string;
            controllerMethod: string;
        }[];
    }

    private static getRegisteredFilters(target) {
        return (Reflect.getMetadata(this.filtersSymbol, target) || []) as {
            filter: Filter;
        }[];
    }
}

export type Filter = IRouterHandler<any> & IRouterMatcher<any>;
export type ControllerResolver = (request: Request, controllerType) => Controller;
export interface ControllerOptions {
    resolveController: ControllerResolver;
}
