import { Container } from './container';
import { Lazy } from './lazy';

const InjectProperties = Symbol('inject:property');
type InjectPropertiesType = { key: string | symbol, token: any }[];

const InjectCtorParams = Symbol('inject:ctor_params');
type InjectCtorParamsType = any[];

export function Injectable(): ClassDecorator {
    return (target) => { };
}

export function Inject(token?: any): ParameterDecorator & PropertyDecorator {
    return function (target: any, propertyKey: string | symbol, index?: number) {
        if (index === void 0) {
            let injectProperties: InjectPropertiesType = Reflect.getMetadata(InjectProperties, target);
            if (!injectProperties) { injectProperties = []; }
            injectProperties.push({
                key: propertyKey,
                token: token,
            });
            Reflect.defineMetadata(InjectProperties, injectProperties, target);
        } else {
            let injectParams: InjectCtorParamsType = Reflect.getMetadata(InjectCtorParams, target);
            if (!injectParams) { injectParams = []; }
            injectParams[index] = token;
            Reflect.defineMetadata(InjectCtorParams, injectParams, target);
        }
    };
}

function resolveValue(container: Container, designType, token) {
    if (designType === Lazy) {
        if (!token) { throw new Error('must specify inject token on lazy types'); }
        return new Lazy(() => container.resolve(token));
    }

    return container.resolve(token || designType);
}

export function getClassFactory(target) {
    const ctorParamsDecorators: [] = Reflect.getMetadata(InjectCtorParams, target) || [];
    const ctorParamsDesignTypes: [] = Reflect.getMetadata('design:paramtypes', target) || [];
    const ctorParamsInject = new Array(Math.max(ctorParamsDecorators.length, ctorParamsDesignTypes.length))
        .fill(0).map((_, index) => ({
            token: ctorParamsDecorators[index],
            designType: ctorParamsDesignTypes[index],
        }));
    const decoratedProperties: InjectPropertiesType = Reflect.getMetadata(InjectProperties, target.prototype) || [];
    const injectProperties = decoratedProperties.map(prop => ({
        ...prop,
        designType: Reflect.getMetadata('design:type', target.prototype, prop.key),
    }));

    return (container: Container) => {
        try {
            const ctorParams = ctorParamsInject.map(p => resolveValue(container, p.designType, p.token));
            const instance = new target(...ctorParams);

            for (const prop of injectProperties) {
                instance[prop.key] = resolveValue(container, prop.designType, prop.token);
            }

            return instance;
        } catch (err) {
            throw new Error(`Could not resolve ${target.name} - "${err.message}"`);
        }
    };
}
