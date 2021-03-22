/* eslint-disable no-console */
/* eslint-disable func-style */
/* eslint-disable no-use-before-define */

import * as fs from 'fs';
import * as path from 'path';
import mkdirp from 'mkdirp';

import { parseStruct } from 'ts-file-parser';

import { Config } from './model/config';
import { FileMetadata } from './model/filemetadata';
import { GenerateViewOptions } from './model/generateViewOptions';

import {
    downFirstLetter,
    Decorators,
    FuncDirection,
    ConsoleColor,
    createClassMeta,
    createFieldMetadata,
    filterFileMetadata,
    mapFileClasses,
    createMapperFile,
    getAllFiles,
    makeCorrectImports,
    saveInfoAboutTransformer
} from './pipes';

import { NunjucksService } from './service/nunjuks';

const configName = 'genconfig.json';
const UTF8 = 'utf8';

export function createMetadatas(files: string[]): FileMetadata[] {
    let generationFiles: FileMetadata[] = [];
    const uniqueFiles = Array.from(new Set(files));
    uniqueFiles.forEach(file => {
        const stringFile = fs.readFileSync(file, 'utf-8');
        try {
            const jsonStructure = parseStruct(stringFile, {}, file);
            const possibleImports = jsonStructure._imports || [];
            jsonStructure.classes.forEach(cls => {
                const generateViewDecorators = (cls.decorators || []).filter(dec => dec.name === Decorators.GenerateView);

                if (!generateViewDecorators.length) {
                    return;
                }

                generateViewDecorators.forEach(dec => {
                    const options = dec.arguments[0].valueOf() as GenerateViewOptions;
                    const {filePath, model, mapperPath} = options;
                    let fileMetadata = new FileMetadata();
                    fileMetadata.basePath = file;
                    const classMeta = createClassMeta(model, mapperPath);
                    fileMetadata.filename = `${filePath}/${downFirstLetter(model)}.ts`;
                    fileMetadata.mapperPath = mapperPath;

                    classMeta.type = options.type || 'interface';
                    classMeta.baseName = cls.name;
                    classMeta.baseNamePath = file;
                    classMeta.fields = cls.fields.map(fld => createFieldMetadata(fld, jsonStructure, classMeta, possibleImports));   

                    const fieldsWithConvertFunctions = classMeta.fields.filter(f => f.fieldConvertFunction);
                    fieldsWithConvertFunctions.forEach(f => {
                        const func = f.fieldConvertFunction;
                        saveInfoAboutTransformer(FuncDirection.toView, func, possibleImports, classMeta);
                        saveInfoAboutTransformer(FuncDirection.fromView, func, possibleImports, classMeta);
                    });

                    fileMetadata.classes = classMeta;

                    const correctImports = makeCorrectImports(fileMetadata, possibleImports)

                    fileMetadata.imports = correctImports;

                    generationFiles.push(fileMetadata);
                });        
            });
        } catch (e) {
            console.log(ConsoleColor.Red, `file ${file} has error: ${e.message}`);
            console.log(e);
            console.log(ConsoleColor.Default);
        }
    });

    const result = generationFiles.filter(file => file.filename);
    return result;
}

export function createFiles(filesMetadata: FileMetadata[]): void {
    filesMetadata.forEach(_fileMetadata => {
        const fileMetadata = { ..._fileMetadata };
        if (!fileMetadata.classes.generateView) {
            return;
        }
    
        if (fileMetadata.mapperPath) {
            fileMetadata.classes = mapFileClasses(fileMetadata.classes, fileMetadata);
        }
        fileMetadata.imports = filterFileMetadata(fileMetadata.imports, fileMetadata.classes);
        const nunjucks = new NunjucksService();
        const generatedClassFileContent = nunjucks.createViewTemplate(fileMetadata);
        const createdMapperFileContent = nunjucks.createMapperTemplate(fileMetadata);

        const generatedFileExist: string = generatedClassFileContent && generatedClassFileContent.trim();

        if (!generatedFileExist) {
            return;
        }
        mkdirp.sync(path.dirname(fileMetadata.filename));
        fs.writeFileSync(fileMetadata.filename, generatedClassFileContent, 'utf-8');

        const needMapper = !!fileMetadata.classes.needMapper;

        if (!needMapper) {
            return;
        }

        createMapperFile(fileMetadata, createdMapperFileContent);
    });
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
