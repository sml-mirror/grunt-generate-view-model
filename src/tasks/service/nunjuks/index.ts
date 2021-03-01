import { configure, Environment } from 'nunjucks';
import * as path from 'path';

export class NunjucksService {
    private type;
    private env: Environment;

    private configureEnv = function (type: 'class'| 'interface') {
        const templatePath= `./view/${type}`;
        const viewsFolder = path.resolve(path.resolve(__dirname, '../../'), templatePath);
        this.env = configure(viewsFolder, { autoescape: true, trimBlocks: true });
        this.env.addFilter('is_string', (obj: any) => {
            return typeof obj == 'string';
        });
    }

    constructor(payload) {
        this.type = payload;
        this.configureEnv(this.type);
    };

    public createViewTemplate = (metafile: any): string => {
        if (!this.env) {
            throw Error('Не настроен env')
        }
        const generated = this.env.render('viewTemplateCommon.njk', { metafile });
        return generated;
    }

    public createMapperTemplate = (metafile: any): string => {
        if (!this.env) {
            throw Error('Не настроен env')
        }
        const generated = this.env.render('mapperTemplate.njk', { metafile });
        return generated;
    }


}