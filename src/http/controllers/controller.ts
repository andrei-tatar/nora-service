
import { Request, Response } from 'express';
import { readFile } from 'fs';
import { join } from 'path';

import { Inject } from '../../ioc';

export abstract class Controller {
    private static templateCache: _.Dictionary<Promise<string>> = {};

    @Inject('response')
    protected readonly response: Response;

    @Inject('request')
    protected readonly request: Request;

    protected async renderTemplate(name: string, data?: any) {
        let templatePromise = Controller.templateCache[name];
        if (!templatePromise) {
            Controller.templateCache[name] = templatePromise = new Promise<string>((resolve, reject) => {
                readFile(join(__dirname, `${name}.html`), (err, file) => {
                    if (err) { reject(err); } else { resolve(file.toString()); }
                });
            });
        }

        const template = await templatePromise;
        return data ? template.replace(/\{\{(\w+)\}\}/mg, (_, id) => data[id] || '') : template;
    }
}
