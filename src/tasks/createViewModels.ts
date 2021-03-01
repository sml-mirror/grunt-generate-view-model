/* eslint-disable no-console */
/* eslint-disable func-style */
/* eslint-disable no-use-before-define */

import * as fs from 'fs';
import * as path from 'path';
import { parseStruct } from 'ts-file-parser';
import { configure, Environment } from 'nunjucks';
import mkdirp from 'mkdirp';

import { Config } from './model/config';
import { FileMetadata } from './model/filemetadata';
import { GenerateViewOptions } from './model/generateViewOptions';


import { downFirstLetter } from './pipes';
import { Decorators } from './pipes/decorators';
import { FuncDirection, ConsoleColor } from './pipes/enums';
import {
    createClassMeta,
    createFieldMetadata,
    filterFileMetadata,
    mapFileClasses,
} from './pipes/classmeta';
import { createMapperFile, getAllFiles } from './pipes/files';
import { makeCorrectImports } from './pipes/import';
import { saveInfoAboutTransformer } from './pipes/transformer';

const configName = 'genconfig.json';
const UTF8 = 'utf8';

export function createMetadatas(files: string[]): FileMetadata[] {
    let generationFiles: FileMetadata[] = [];

    files.forEach(file => {
        const stringFile = fs.readFileSync(file, 'utf-8');
        const jsonStructure = parseStruct(stringFile, {}, file);
        const possibleImports = jsonStructure._imports || [];
        jsonStructure.classes.forEach(cls => {
            const generateViewDecorators = (cls.decorators || []).filter(dec => dec.name === Decorators.GenerateView);

            if (!generateViewDecorators.length) {
                return;
            }

            const classesMeta = generateViewDecorators.map(dec => {
                const genViewOpt = dec.arguments[0].valueOf() as GenerateViewOptions;
                const classMeta = createClassMeta(genViewOpt.model, genViewOpt.mapperPath);
                const newFileMetadata = FillFileMetadataArray( genViewOpt, file);
                const metadataExist = generationFiles.find(file => file.filename === newFileMetadata.filename);
                if (metadataExist) {
                    return classMeta;
                }
                generationFiles.push(FillFileMetadataArray( genViewOpt, file));
                return classMeta;
            });

            classesMeta.forEach(cm => {
                cm.baseName = cls.name;
                cm.baseNamePath = file;
                cls.fields.forEach(fld => {
                    const fieldMetadata = createFieldMetadata(fld, jsonStructure, cm, possibleImports);
                    cm.fields.push(fieldMetadata);
                });

                const fieldsWithConvertFunctions = cm.fields.filter(f => f.fieldConvertFunction);
                fieldsWithConvertFunctions.forEach(f => {
                    const func = f.fieldConvertFunction;
                    saveInfoAboutTransformer(FuncDirection.toView, func, possibleImports, cm);
                    saveInfoAboutTransformer(FuncDirection.fromView, func, possibleImports, cm);
                });
            });

            classesMeta.forEach( cm => {
                const classMetaFileName = `${downFirstLetter(cm.name)}.ts`;
                generationFiles = generationFiles.map(file => {
                    if (file.filename.includes(classMetaFileName)) {
                        file.classes.push(cm);
                    }
                    return file;
                })
            });

            generationFiles.map(file => {
                const mappedFile = {...file}
                if (possibleImports.find(pI => pI.clauses.find(c => c === 'Length'))) {
                    console.log('possibleImports', possibleImports);
                }
                const correctImports = makeCorrectImports(mappedFile, possibleImports)
                if (possibleImports.find(pI => pI.clauses.find(c => c === 'Length'))) {
                    console.log('returnedImports', correctImports);
                }
                mappedFile.imports.push(...correctImports);
                return mappedFile;
            });
            
        });
    });

    const result = generationFiles.filter(file => file.filename);
    return result;
}

export function createFiles(filesMetadata: FileMetadata[]): void {
    filesMetadata.forEach(_fileMetadata => {
        const fileMetadata = { ..._fileMetadata };
        fileMetadata.classes = fileMetadata.classes.filter(item => item.generateView);
        if (fileMetadata.mapperPath) {
            fileMetadata.classes = mapFileClasses(fileMetadata.classes, fileMetadata);
        }
        fileMetadata.imports = filterFileMetadata(fileMetadata.imports, fileMetadata.classes);
        _fileMetadata.classes.forEach(c => {
            c.fields.forEach(f => {
                if (f.decorators?.length) {
                console.log(c.name, f.name, f.decorators);
                }
            });
        })

        const templatePath= `./view/${_fileMetadata.type}`;
        const viewsFolder = path.resolve(__dirname, templatePath);
        const env = configure(viewsFolder, { autoescape: true, trimBlocks: true });
        env.addFilter('is_string', (obj: any) => {
            return typeof obj == 'string';
        });
        const generatedClassFileContent = env.render('viewTemplateCommon.njk', { metafile: fileMetadata,  });
        const createdMapperFileContent = env.render('mapperTemplate.njk', { metafile: fileMetadata });
        const generatedFileExist: string = generatedClassFileContent && generatedClassFileContent.trim();

        if (!generatedFileExist) {
            return;
        }

        mkdirp.sync(path.dirname(fileMetadata.filename));
        fs.writeFileSync(fileMetadata.filename, generatedClassFileContent, 'utf-8');

        const needMapper = !fileMetadata.classes.some(cls => !cls.needMapper);

        if (!needMapper) {
            return;
        }

        createMapperFile(fileMetadata, createdMapperFileContent);
    });
}

function FillFileMetadataArray(genViewOpt: GenerateViewOptions, file: string) {
    const { filePath, model } = genViewOpt;
    const fileMet = new FileMetadata();
    fileMet.basePath = file;
    fileMet.classes = [];
    fileMet.filename = `${filePath}/${downFirstLetter(model)}.ts`;
    fileMet.mapperPath = genViewOpt.mapperPath;
    if (genViewOpt.type) {
        fileMet.type = genViewOpt.type;
    }
    return fileMet;
}


export const createViewModelsInternal = () => {
    try {
        const dateStart = Date.now();
        const config: Config = JSON.parse(fs.readFileSync(configName, UTF8));
        const possibleFiles = getAllFiles(config.check.folders);
        const metadata = createMetadatas(possibleFiles);
        createFiles(metadata);
        const dateEnd = Date.now();

        console.log(ConsoleColor.Green, `Generate View: Count of files: ${possibleFiles.length}`);
        console.log(`Generate View: Execution time: ${dateEnd - dateStart}ms`);
    } catch (e) {
        console.log(ConsoleColor.Red, e.message);
    } finally {
        console.log(ConsoleColor.Default);
    }
}
