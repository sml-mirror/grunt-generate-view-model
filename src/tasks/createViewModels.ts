/* eslint-disable no-console */
/* eslint-disable func-style */
/* eslint-disable no-use-before-define */

import * as fs from 'fs';
import * as path from 'path';
import { parseStruct, ImportNode } from 'ts-file-parser';
import { render, configure } from 'nunjucks';
import mkdirp from 'mkdirp';

import { Config } from './model/config';
import { FileMetadata } from './model/filemetadata';
import { ClassMetadata } from './model/classmetadata';
import { GenerateViewOptions } from './model/generateViewOptions';
import { Transformer } from './model/transformer';

import { downFirstLetter } from './pipes';
import { Decorators } from './pipes/decorators';
import { asyncDirection, FuncDirection, ConsoleColor } from './pipes/enums';
import {
    createClassMeta,
    createFieldMetadata,
    filterFileMetadata,
    mapFileClasses,
} from './pipes/classmeta';
import { createMapperFile, getAllFiles } from './pipes/files';
import { makeCorrectImports } from './pipes/import';

const primitiveTypes = ['string', 'number', 'object', 'any', 'null', 'undefined'];
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
                const correctImports = makeCorrectImports(mappedFile, possibleImports)
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
        const templatePath= `./view/${_fileMetadata.type}`;
        const viewsFolder = path.resolve(__dirname, templatePath);

        configure(viewsFolder, { autoescape: true, trimBlocks: true });
        const fileMetadata = { ..._fileMetadata };
        fileMetadata.classes = fileMetadata.classes.filter(item => item.generateView);
        if (fileMetadata.mapperPath) {
            fileMetadata.classes = mapFileClasses(fileMetadata.classes, fileMetadata);
        }
        fileMetadata.imports = filterFileMetadata(fileMetadata.imports, fileMetadata.classes);
        const generatedClassFileContent = render('viewTemplateCommon.njk', { metafile: fileMetadata });
        const createdMapperFileContent = render('mapperTemplate.njk', { metafile: fileMetadata });
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

function saveInfoAboutTransformer(direction: FuncDirection, func: Transformer, possibleImports: ImportNode[], cm: ClassMetadata) {
    if (!direction) {
        return;
    }
    const isTransformFunctionExist = !!func[direction]?.function;
    if (!isTransformFunctionExist) {
        return;
    }
    const importFunctionName = func[direction].function;
    const moduleImport = possibleImports.find(possibleImport => possibleImport.clauses.indexOf(importFunctionName) > -1);
    if (moduleImport) {
        let fileContentInString = '';
        let pathFromFile = moduleImport.absPathNode.join('/');
        const getContentFrom = (from: string) => {
            fileContentInString = fs.readFileSync(path.resolve(pathFromFile + from)).toString();
            pathFromFile = `${pathFromFile}${from}`;
        };

        try {
            getContentFrom('.ts');
        } catch (e) {
            getContentFrom('/index.ts');
        }

        const jsonStructure = parseStruct(fileContentInString, {}, pathFromFile);
        const { functions } = jsonStructure;

        const targetFuncs = functions.find(func => func.name === importFunctionName);
        func[direction].isAsync = targetFuncs.isAsync;
        const asyncDirect = asyncDirection[direction];
        if (!cm[asyncDirect]) {
            cm[asyncDirect] = targetFuncs.isAsync;
        }
        func[direction].isPrimitive = false;
        const contextObject = targetFuncs.params[1]
        const contextTypeOfTransformer = contextObject?.type || null;
        const contextMandatoryOfType = contextObject?.mandatory || false;
        const directionValueInfo = cm.contextType[direction];
        if (!contextTypeOfTransformer) {
            return;
        }
        if (!directionValueInfo.value || directionValueInfo.value === contextTypeOfTransformer || contextTypeOfTransformer === 'any') {
            directionValueInfo.value = contextTypeOfTransformer;
            directionValueInfo.mandatory = contextMandatoryOfType || directionValueInfo.mandatory;
            const fieldsWithContext = cm.fields.filter(f => !!f.fieldConvertFunction?.[direction]);
            fieldsWithContext.forEach(f => {
                const funcToRecognize = functions.find(func => func.name === f.fieldConvertFunction[direction].function);
                const isFuncsWithParams = !!funcToRecognize?.params[1];
                if (!isFuncsWithParams) {
                    return;
                }
                cm.contextTypeFields[direction].push(f.name);
            });
        } else {
            throw new Error('Context for one-side mapper should be of one type or any');
        }
        const isPrimitiveType = !!primitiveTypes.find(type => type === directionValueInfo.value );
        if (isPrimitiveType) {
            return;
        }
        const contextTypeImport = jsonStructure._imports.find(imp => !!imp.clauses.find(clause => directionValueInfo.value === clause));
        possibleImports.push({
            clauses: [directionValueInfo.value],
            absPathNode: contextTypeImport.absPathNode,
            isNodeModule: false
        });
        return;
    }
    func[direction].isPrimitive = true;
    if ( func[direction].function !== 'null' && func[direction].function !== 'undefined') {
        func[direction].isPrimitiveString = isNaN(+func[direction].function);
    } else {
        func[direction].isPrimitiveString = false;
    }
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
