import { configure, Environment } from 'nunjucks';
import * as path from 'path';
import { FileMetadata } from '../../../tasks/model/filemetadata';

export class NunjucksService {

    private env: Environment;

    private configureEnv = function () {
        const templatePath= `./view`;
        const viewsFolder = path.resolve(path.resolve(__dirname, '../../'), templatePath);
        this.env = configure(viewsFolder, { autoescape: false, trimBlocks: true });
        this.env.addFilter('is_string', (obj: any) => {
            if (!obj) {
                return false;
            }
            const isString = typeof obj == 'string';
            if (!isString) {
                return false;
            }
            const arrowFunctionCheck = (obj as string).match(/\({0,1}.+\){0,1}\s{0,1}=>/)
            return !arrowFunctionCheck;
        });
        this.env.addFilter('is_not_empty', (obj: any) => {
            return !!obj
        });
    }

    constructor() {
        this.configureEnv();
    };

    public createViewTemplate = (metafile: FileMetadata): string => {
        if (!this.env) {
            throw Error('Не настроен env')
        }
        const generated = this.env.render('viewTemplateCommon.njk', { class: metafile.classes, imports: metafile.imports });
        return generated;
    }

    public createMapperTemplate = (metafile: any): string => {
        if (!this.env) {
            throw Error('Не настроен env')
        }
        const generated = this.env.render('mapperTemplate.njk', { class: metafile.classes, imports: metafile.imports });
        return generated;
    }


}