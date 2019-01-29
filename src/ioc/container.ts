import { AggregateError } from '../errors/aggregate';
import { Destroyable, Lifetime, Provider, Token } from './contract';
import { getClassFactory } from './inject';

export class Container implements Destroyable {
    private factories = new Map<any, (container: Container) => any>();
    private instances = new Map<any, any>();
    private destroyableInstances: Destroyable[] = [];
    private destroyed = false;

    constructor(
        private lifetime = Lifetime.Container,
        private readonly parent?: Container,
    ) {
    }

    register(...providers: Provider[]) {
        this.throwIfDestroyed();
        for (const provider of providers) {
            if ('useValue' in provider) {
                this.instances.set(provider.token, provider.useValue);
            } else if ('useClass' in provider) {
                const classFactory = getClassFactory(provider.useClass);
                this.factories.set(provider.token, container => {
                    const instance = classFactory(container);
                    this.instanceCreated(provider, container, instance);
                    return instance;
                });
            } else if ('useFactory' in provider) {
                this.factories.set(provider.token, container => {
                    const argsTokens = provider.inject || [];
                    const args = argsTokens.map(token => container.resolve(token));
                    const instance = provider.useFactory(...args);
                    this.instanceCreated(provider, container, instance);
                    return instance;
                });
            } else {
                throw new Error('invalid provider');
            }
        }
    }


    resolve<T = any>(token: Token<T>): T {
        return this.resolveInternal(token, this);
    }

    createChild() {
        this.throwIfDestroyed();
        return new Container(this.lifetime, this);
    }

    destroy() {
        if (this.destroyed) { throw new Error('container already destroyed'); }
        this.destroyed = true;

        this.instances.clear();
        const errors = [];
        for (const instance of this.destroyableInstances) {
            try {
                instance.destroy();
            } catch (err) {
                errors.push(err);
            }
        }
        this.destroyableInstances = [];
        if (errors) {
            throw new AggregateError(errors);
        }
    }

    private throwIfDestroyed() {
        if (this.destroyed) { throw new Error('container destroyed'); }
    }

    private instanceCreated(provider: Provider, requester: Container, instance: any) {
        const lifetime = provider.lifetime || this.lifetime;
        if (lifetime === Lifetime.Container) {
            this.instances.set(provider.token, instance);
            if (typeof instance.destroy === 'function') {
                this.destroyableInstances.push(instance);
            }
        } else {
            if (typeof instance.destroy === 'function') {
                requester.destroyableInstances.push(instance);
            }
        }
    }

    protected resolveInternal(token: Token, initiator: Container) {
        if (!this.destroyed) {
            if (token === Container) {
                return initiator;
            }

            if (this.instances.has(token)) {
                return this.instances.get(token);
            }

            if (this.factories.has(token)) {
                return this.factories.get(token)(initiator);
            }
        }

        if (this.parent) {
            return this.parent.resolveInternal(token, initiator);
        }

        throw new Error(`token could not be resolved ${typeof token === 'function' ? token.name : token}`);
    }
}
