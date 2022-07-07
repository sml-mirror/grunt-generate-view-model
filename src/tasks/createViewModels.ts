/* eslint-disable no-console */
/* eslint-disable func-style */
/* eslint-disable no-use-before-define */

import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import * as path from 'path';
import mkdirp from 'mkdirp';

import { Decorator, parseStruct } from 'ts-file-parser';

import { Config } from './model/config';
import { FileMetadata } from './model/filemetadata';
import { GenerateViewOptions } from './model/generateViewOptions';

import {
    downFirstLetter,
    Decorators,
    ConsoleColor,
    createClassMeta,
    filterFileMetadata,
    mapFileClasses,
    createMapperFile,
    getAllFiles,
    makeCorrectImports,
} from './pipes';

import { NunjucksService } from './service/nunjuks';

const configName = 'genconfig.json';
const UTF8 = 'utf8';

export async function createMetadatas(filePathes: string[], configOptions?: {extendLevel?: number}): Promise<FileMetadata[]> {
    const generatedFiles: FileMetadata[] = [];
    const uniqueFilePathes = Array.from(new Set(filePathes));

    await Promise.all(uniqueFilePathes.map(async path => {
        const stringFile = await fsPromise.readFile(path, {encoding: 'utf-8'});
        try {
            const fileStructure = parseStruct(stringFile, {}, path);
            const fileImports = fileStructure._imports || [];
            fileStructure.classes.forEach(baseClass => {
                const { decorators } = baseClass;
                const generateViewDecorators: Decorator[] = decorators.filter(dec => dec.name === Decorators.GenerateView);
                if (!generateViewDecorators.length) {
                    return;
                }

                generateViewDecorators.forEach(dec => {
                    const options = dec.arguments[0].valueOf() as GenerateViewOptions;
                    const {filePath, model, mapperPath} = options;

                    const fileMetadata = new FileMetadata();
                    fileMetadata.basePath = path;
                    fileMetadata.filename = `${filePath}/${downFirstLetter(model)}.ts`;
                    fileMetadata.mapperPath = mapperPath;
                    fileMetadata.classMetadata = createClassMeta(baseClass, options, fileImports, path, configOptions?.extendLevel || 2);
                    fileMetadata.imports = makeCorrectImports(fileMetadata, fileImports);

                    if (fileMetadata.mapperPath) {
                        fileMetadata.classMetadata = mapFileClasses(fileMetadata.classMetadata, fileMetadata);
                    }
                    fileMetadata.imports = filterFileMetadata(fileMetadata.imports, fileMetadata.classMetadata);

                    generatedFiles.push(fileMetadata);
                });
            });

        } catch (e) {
            console.log(ConsoleColor.Red, `file ${path} has error: ${e.message}`);
            console.log(ConsoleColor.Default);
        }
    }));
    const result = generatedFiles.filter(file => file.filename);
    return result;
}

export async function createFiles(filesMetadata: FileMetadata[]): Promise<void> {
    await Promise.all(filesMetadata.map(async _fileMetadata => {
        const fileMetadata = { ..._fileMetadata };
        if (!fileMetadata.classMetadata.generateView) {
            return;
        } 

        const nunjucks = new NunjucksService();
        const generatedClassFileContent = nunjucks.createViewTemplate(fileMetadata);
        const createdMapperFileContent = nunjucks.createMapperTemplate(fileMetadata);

        const generatedFileExist: string = generatedClassFileContent && generatedClassFileContent.trim();

        if (!generatedFileExist) {
            return;
        }

        mkdirp.sync(path.dirname(fileMetadata.filename));
        await fsPromise.writeFile(fileMetadata.filename, generatedClassFileContent, {encoding: 'utf-8'});

        const needMapper = !!fileMetadata.classMetadata.needMapper;

        if (!needMapper) {
            return;
        }

        createMapperFile(fileMetadata, createdMapperFileContent);
    }));
}

export const createViewModelsInternal = async () => {
    try {
        const dateStart = Date.now();
        const file = await fsPromise.readFile(configName, {encoding: UTF8});
        const config: Config = JSON.parse(file);
        const possibleFilePathes = getAllFiles(config.check.folders);
        console.log(ConsoleColor.Green, `Generate View: Count of files: ${possibleFilePathes.length}`);
        const metadata = await createMetadatas(possibleFilePathes, config.options);
        await createFiles(metadata);
        const dateEnd = Date.now();
        console.log(ConsoleColor.Green,`Generate View: Execution time: ${dateEnd - dateStart}ms`);
    } catch (e) {
        console.log(ConsoleColor.Red, e.message);
    } finally {
        console.log(ConsoleColor.Default);
    }
}
