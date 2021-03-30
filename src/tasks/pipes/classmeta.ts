/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from 'fs';
import {
    parseStruct,
    ArrayType,
    BasicType,
    Decorator,
    FieldModel,
    ImportNode,
    TypeKind
} from 'ts-file-parser';

import { getModelNameFromPath, upFirstLetter } from '.';
import { GenerateViewOptions, ViewModelTypeOptions } from '../../..';

import { Decorators } from './decorators';
import { ConsoleColor } from './enums';

import { Import } from '../model/import';
import { ClassMetadata } from '../model/classmetadata';
import { FieldMetadata } from '../model/fieldmetadata';
import { FileMetadata } from '../model/filemetadata';

import { unique } from '../pipes';
import { ignoreDecorators } from '../../tasks/constants/ignoreDecorators';

const arrayType = '[]';
const baseTypes = ['string', 'number', 'boolean', 'undefined', 'null', 'object'];

export const createClassMeta = (name: string, mapperPath?: string ) => {
    const classMeta = new ClassMetadata();
    classMeta.name = upFirstLetter(name);
    classMeta.fields = [];
    classMeta.generateView = true;
    if (mapperPath) {
        classMeta.needMapper = true;
    }
    return classMeta;
};


export const getInfoFromImports = (imports: ImportNode[], typeName: string) => {
    let isComplexType = true;
    let isEnum = false;
    imports.forEach(repeatImport => {
        if (repeatImport.isNodeModule) {
            return;
        }
        repeatImport.clauses.forEach( cl => {
            if (cl !== typeName) {
                return;
            }
            const fileName = repeatImport.absPathNode.join('/') + '.ts';
            const fileContent = fs.readFileSync(fileName, 'utf-8');
            const parsedFile = parseStruct(fileContent, {}, fileName);
            if (!parsedFile.enumDeclarations) {
                return;
            }
            const isEnumType = !!parsedFile.enumDeclarations.find(enm => enm.name === typeName);
            isComplexType = !isEnumType;
            isEnum = !!isEnumType;
        });
    });

    return {
        isComplexType,
        isEnum
    };
};

export const updateFieldMetadataForIgnoreDecorators = (
    ignoreDecorators: Decorator[],
    classMeta: ClassMetadata,
    fldMetadata: FieldMetadata,
    decoratorsOnField: Decorator[],
    fileStructure: any,
    ) => {
    const newFldMetadata = {...fldMetadata};
    const noIgnoreDecorators = !ignoreDecorators.length;
    const  fieldIgnoreDecorators = [...(ignoreDecorators.map(dec => dec.arguments[0]) || []), ...ignoreDecorators] as string[];
    const fieldIgnoreDecoratorsClasses = (ignoreDecorators.map(dec => dec.arguments[1]) || []) as string[];
    if (!decoratorsOnField || !decoratorsOnField.length) {
        newFldMetadata.decorators= [];
        return {
            fieldMetadata: newFldMetadata,
            possibleImports: [],
        };
    }
    const possibleImports: ImportNode[] = [];

    newFldMetadata.decorators = decoratorsOnField.filter(dec => {
        const isDecoratorAvailableForField = noIgnoreDecorators && !fieldIgnoreDecorators.includes(dec.name);
        const isDecoratorAvailableForClass = noIgnoreDecorators && !fieldIgnoreDecoratorsClasses.includes(classMeta.name);
        return isDecoratorAvailableForClass && isDecoratorAvailableForField;
    });

    newFldMetadata.decorators.forEach(dec => {
        const importNode = fileStructure._imports.find(_import => _import.clauses.find(cl => cl === dec.name));
        if (!importNode) {
            return;
        }
        possibleImports.push(importNode);
    })

    return {
        fieldMetadata: newFldMetadata,
        possibleImports,
    };
}


export const updateFieldMetadataForIgnoreViewModelDecorator = (decorators: Decorator[], classMeta: any, fldMetadata: FieldMetadata) => {
    if (!decorators || !decorators.length) {
        return fldMetadata;
    }

    const updatedFldMetadata = { ...fldMetadata };

    decorators.forEach(decorator => {
        const ignoreViewModelName = decorator.arguments[0];
        const setIgnoreNameToClass = ignoreViewModelName && ignoreViewModelName.toString() === classMeta.name;
        const ignoredInView = setIgnoreNameToClass || !ignoreViewModelName;
        if (ignoredInView && !updatedFldMetadata.ignoredInView ) {
            updatedFldMetadata.ignoredInView = true;
        }
    });

    return updatedFldMetadata;
};

export const updateFieldMetadataForViewModelNameDecorator = (
    decorators: Decorator[],
    classMeta: any,
    fldMetadata: FieldMetadata) => {
    if (!decorators || !decorators.length) {
        return fldMetadata;
    }

    const updatedFldMetadata = { ...fldMetadata };

    decorators.forEach(decorator => {
        const fieldName = decorator.arguments[0];
        const modelName = decorator.arguments[1];
        const modelNameSetForClass = modelName && modelName.toString() === classMeta.name;
        if (modelNameSetForClass || !modelName) {
            updatedFldMetadata.name = fieldName.toString();
        }
    });

    return updatedFldMetadata;
};

export const updateFieldMetadataForViewModelTypeDecorator = (
    decorators: Decorator[], classMeta: ClassMetadata, flMetadata: FieldMetadata, fileStructure: any) => {
    try {
        if (!decorators || !decorators.length) {
            return { fieldMetadata: flMetadata, possibleImports: [] };
        }
        const updatedFieldMetadata = { ...flMetadata };
        const possibleImports: ImportNode[] = [];
        decorators.forEach(decorator => {
            const fieldTypeOptions = decorator.arguments[0].valueOf() as ViewModelTypeOptions;
            updatedFieldMetadata.nullable = !(fieldTypeOptions && typeof fieldTypeOptions.nullable === 'boolean' && !fieldTypeOptions.nullable);
            const fieldIsAvailableToClass = fieldTypeOptions.modelName && fieldTypeOptions.modelName === classMeta.name;
            const allFieldsForAllClassAvailable = !fieldTypeOptions.modelName;
            if (fieldIsAvailableToClass || allFieldsForAllClassAvailable) {

                updatedFieldMetadata.type = fieldTypeOptions.type.toString();
                if (updatedFieldMetadata.type.indexOf(arrayType) > -1) {
                    updatedFieldMetadata.type = updatedFieldMetadata.type.substring(0, updatedFieldMetadata.type.indexOf(arrayType));
                    updatedFieldMetadata.isArray = true;
                } else {
                    updatedFieldMetadata.isArray = false;
                }
                if ( updatedFieldMetadata.type.toLowerCase() === 'string' && updatedFieldMetadata.type !== updatedFieldMetadata.baseModelType ) {
                    updatedFieldMetadata.type = 'string';
                    updatedFieldMetadata.toStringWanted = true;
                }
                if (!fieldTypeOptions.transformer) {
                    fileStructure._imports.forEach(i => {
                        i.clauses.forEach(clause => {
                            if (clause !== updatedFieldMetadata.baseModelType) {
                                return;
                            }
                            let path = '';
                            if (i.isNodeModule) {
                                const impNode: ImportNode = { isNodeModule: true, clauses: i.clauses, absPathNode: i.absPathNode };
                                possibleImports.push(impNode);
                                return;
                            }
                            i.absPathNode.forEach(node => {
                                path += `${node}/`;
                            });
                            path = `${path.substring(0, path.length - 1)}.ts`;
                            const content = fs.readFileSync(path, 'utf-8');
                            const innerJsonStructure = parseStruct(content, {}, '');
                            innerJsonStructure.classes.forEach(c => {
                                if (c.name !== updatedFieldMetadata.baseModelType) {
                                    return;
                                }
                                c.decorators.forEach(d => {
                                    if (d.name !== Decorators.GenerateView) {
                                        return;
                                    }
                                    const generateOptions = d.arguments[0].valueOf() as GenerateViewOptions;
                                    let viewModelType = fieldTypeOptions.type.toString();
                                    if (fieldTypeOptions.type.toString().indexOf(arrayType) > -1 ) {
                                        viewModelType = viewModelType.substring(0, fieldTypeOptions.type.toString().indexOf(arrayType));
                                    }
                                    if (generateOptions.model.toLowerCase() !== viewModelType.toLowerCase()) {
                                        return;
                                    }
                                    const mapperImport: ImportNode = { isNodeModule: false, clauses: [], absPathNode: [] };
                                    const { model } = generateOptions;
                                    const fileName = `${upFirstLetter(model)}Mapper`;
                                    mapperImport.clauses.push(fileName);
                                    mapperImport.absPathNode.push(`${generateOptions.mapperPath}/${fileName}`);
                                    updatedFieldMetadata.needGeneratedMapper = true;
                                    possibleImports.push(mapperImport);
                                });
                            });
                        });
                    });
                }
            }
            const transformerExistAndNoNeedMapper = fieldTypeOptions.transformer && !updatedFieldMetadata.needGeneratedMapper;
            if (!transformerExistAndNoNeedMapper) {
                return;
            }
            if (fieldTypeOptions.modelName && !updatedFieldMetadata.ignoredInView && classMeta.name === fieldTypeOptions.modelName ) {
                updatedFieldMetadata.fieldConvertFunction = fieldTypeOptions.transformer;
            } else if (!updatedFieldMetadata.ignoredInView ) {
                updatedFieldMetadata.fieldConvertFunction = fieldTypeOptions.transformer;
            }
        });

        return { fieldMetadata: updatedFieldMetadata, possibleImports };
    } catch (e) {
        console.error(ConsoleColor.Red, `Generate View: Error: updateFieldMetadataForViewModelTypeDecorator: ${e.message}`);
        throw e;
    }
};


// dirty function - update possible imports;
export const createFieldMetadata = (field: FieldModel, json: any, cm: ClassMetadata, possibleImports: any[]) => {
    let fldMetadata = new FieldMetadata();
    fldMetadata.baseModelName = field.name;
    fldMetadata.nullable = true;
    if (field.type.typeKind === TypeKind.ARRAY) {
        fldMetadata.isArray = true;
    }

    const typeInfo = (field.type as ArrayType).base || field.type;
    let currentBase: ArrayType = (field.type as ArrayType).base as any;
    fldMetadata.baseModelType = (typeInfo as BasicType).typeName;
    while (currentBase && currentBase.base !== undefined) {
        currentBase = currentBase.base as ArrayType;
        fldMetadata.baseModelType = (currentBase as any as BasicType).typeName;
    }
    const typeName = fldMetadata.baseModelType;
    const isBaseTypesIncludeTypeName = baseTypes.find(type => type === typeName);

    if ( !isBaseTypesIncludeTypeName ) {
        const fldInfo = getInfoFromImports(possibleImports, typeName);
        fldMetadata.isComplexType = fldInfo.isComplexType;
        fldMetadata.isEnum = fldInfo.isEnum;
    }

    fldMetadata.name = field.name;
    fldMetadata.type = fldMetadata.baseModelType;

    const fieldDecorators = field.decorators;
    fldMetadata = updateFieldMetadataForIgnoreViewModelDecorator(
        fieldDecorators.filter(decorator => decorator.name === Decorators.IgnoreViewModel),
        cm,
        fldMetadata
    );

    fldMetadata = updateFieldMetadataForViewModelNameDecorator(
        fieldDecorators.filter(decorator => decorator.name === Decorators.ViewModelName),
        cm,
        fldMetadata);
    
    const {fieldMetadata, ...rest} = updateFieldMetadataForViewModelTypeDecorator(
        fieldDecorators.filter(decorator => decorator.name === Decorators.ViewModelType),
        cm,
        fldMetadata,
        json
    );

    fldMetadata = fieldMetadata;
    possibleImports.push(...rest.possibleImports);

    const decUpdate = updateFieldMetadataForIgnoreDecorators(
        fieldDecorators?.filter(decorator => decorator.name === Decorators.IgnoreDecorators),
        cm,
        fldMetadata,
        fieldDecorators?.filter(decorator => !ignoreDecorators.includes(decorator.name)),
        json,
    );

    fldMetadata = decUpdate.fieldMetadata;

    if (fldMetadata.type !== fldMetadata.baseModelType &&  !baseTypes.includes(fldMetadata.type)) {
        const fldInfo = getInfoFromImports(possibleImports, fldMetadata.type);
        fldMetadata.isComplexType = fldInfo.isComplexType;
        fldMetadata.isEnum = fldInfo.isEnum;
    }

    console.log(fldMetadata);
    possibleImports.push(...decUpdate.possibleImports);


    return fldMetadata;
};

export const filterFileMetadata = (imports: Import[], classes: ClassMetadata): Import[] => {
    const newImports = imports.filter(imp => {
        const importArray = imp.type.slice(1, imp.type.length - 1).trim().split(',');
        return !importArray.find(_imp => _imp === classes.baseName);
    });

    return newImports;
};

export const mapFileClasses = (classes: ClassMetadata, fileMetadata: FileMetadata): ClassMetadata => {
    const newClass = { ...classes };

    newClass.viewModelFromMapper = getModelNameFromPath(fileMetadata.mapperPath, fileMetadata.filename);
    newClass.baseModelFromMapper = getModelNameFromPath(fileMetadata.mapperPath, fileMetadata.basePath);

    return newClass;
};

export const getDependencyImportsForImports = (_imports: Import[], fileMetadata: FileMetadata) => {
    const mapperFileRegexp = /[a-zA-Z]+Mapper/;
    let imports = [...(_imports || [])];

    imports = imports.reduce((prev, cur) => {
        const curType = cur.type;
        if (prev.find(i => i.type === curType)) {
            return [...prev];
        }
        return [...prev, cur];
    }, []).map( imp => {
        let dependencyMappers: string[] = [];
        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        const mapperMatch = imp.type.match(mapperFileRegexp);
        if (!mapperMatch) {
            imp.dependencyMappers = [];
            return null;
        }
        const mapperName = mapperMatch[0];
        fileMetadata.classes.fields.forEach(field => {
            const condition = mapperName.includes(field.type) && field.needGeneratedMapper && !field.ignoredInView;
            if (!condition) {
                return;
            }
            dependencyMappers.push(field.type);
        });
        dependencyMappers = unique(dependencyMappers);
        imp.dependencyMappers = dependencyMappers;
        return imp;
    }).filter(i => !!i);

    return imports;
};
