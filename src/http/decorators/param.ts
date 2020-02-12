import { Request } from 'express';
import * as url from 'url';

export type Converter = (input: any) => any;

export class Param {
    private static readonly paramsResolversSymbol = Symbol('params');

    static fromParam(name: string, converter?: Converter) {
        return this.fromRequest(req => req.params[name], converter);
    }

    static fromQuery(name: string, converter?: Converter) {
        return this.fromRequest(req => req.query[name], converter);
    }

    static fromBody(name?: string, converter: Converter = this.identity) {
        return this.fromRequest(req => {
            return name && req.body ? req.body[name] : req.body;
        }, converter);
    }

    static fromHeader(name: string, converter?: Converter) {
        return this.fromRequest(req => {
            return req.header(name);
        }, converter);
    }

    static queryString() {
        return this.fromRequest(req => url.parse(req.url).query);
    }

    private static fromRequest(resolve: (req: Request) => any, converter?: Converter) {
        return (target, key, index) => {
            const resolvers = this.getParamResolvers(target.constructor, key);
            if (converter === void 0) {
                const paramTypes = Reflect.getMetadata('design:paramtypes', target, key);
                converter = this.getConverter(paramTypes[index]);
            }
            resolvers.push({
                index,
                resolve,
                converter,
            });
            Reflect.defineMetadata(this.paramsResolversSymbol, resolvers, target.constructor, key);
        };
    }

    private static getConverter(type) {
        switch (type) {
            case Number: return this.convertToNumber;
            case Date: return this.convertToDate;
            case Boolean: return this.convertToBool;
            case Array:
            case Object:
                return this.convertToObject;
            default: return this.identity;
        }
    }

    private static identity(input: any) {
        return input;
    }

    private static convertToNumber(input: any) {
        if (input === void 0) { return input; }
        return Number.parseFloat(input);
    }

    private static convertToBool(input: any) {
        if (typeof input === 'string' && !!input) {
            return (input === 'true');
        }
        return !!input;
    }

    private static convertToDate(input: any) {
        if (input === void 0) { return input; }
        return new Date(input);
    }

    private static convertToObject(input: any) {
        if (input === void 0) { return input; }
        return typeof input === 'string' ? JSON.parse(input) : input;
    }

    private static getParamResolvers(target, method: string) {
        return (Reflect.getMetadata(this.paramsResolversSymbol, target, method) || []) as {
            index: number,
            resolve: (req: Request) => any,
            converter: Converter,
        }[];
    }

    public static getParamsFactory(target, method: string) {
        const resolvers = this.getParamResolvers(target, method);
        return (request: Request) => {
            const params = [];
            for (const resolver of resolvers) {
                const param = resolver.resolve(request);
                params[resolver.index] = resolver.converter(param);
            }
            return params;
        };
    }
}

