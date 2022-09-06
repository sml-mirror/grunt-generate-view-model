/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from 'fs';
import {
    parseStruct,
    ArrayType,
    BasicType,
    Decorator,
    FieldModel,
    ImportNode,
    TypeKind,
    ClassModel
} from 'ts-file-parser';

import { getModelNameFromPath, upFirstLetter } from '.';
import { GenerateViewOptions, ViewModelTypeOptions } from '../../..';

import { Decorators } from '../model/decorators';
import { ConsoleColor, FuncDirection } from './enums';

import { Import } from '../model/import';
import { ClassMetadata } from '../model/classmetadata';
import { FieldMetadata } from '../model/fieldmetadata';
import { FileMetadata } from '../model/filemetadata';

import { unique } from '../pipes';
import { ignoreDecorators } from '../../tasks/constants/ignoreDecorators';
import { saveInfoAboutTransformer } from './transformer';

const arrayType = '[]';
const baseTypes = ['string', 'number', 'boolean', 'undefined', 'null', 'object'];

const filterOnlyIgnoreDecorators = (dec: Decorator) => dec.name === Decorators.IgnoreDecorators;
const whiteListClassDecorators = (dec: Decorator) => !ignoreDecorators.includes(dec.name);

interface Extend {
    typeName: string;
    namespace: string;
    basicName: string;
    typeKind: number;
    typeArguments: any[];
    modulePath: string;
}

const addExtendClassFieldsToClass = (classExtends: Extend[], baseClass: ClassModel, imports: ImportNode[], {
    currentExtendLevel, maxExtendedLevel
}) => {
    const fields: FieldModel[] = [];
    classExtends.forEach((extend: Extend) => {
        const importBaseClass = imports.find(importNode => importNode.clauses.find(clause => clause === extend.basicName));
        const extendFileString = fs.readFileSync(`${importBaseClass.absPathString}.ts`, {encoding: 'utf-8'});
        const extendFileStructure = parseStruct(extendFileString, {}, importBaseClass.absPathString);
        const extendBaseClass = extendFileStructure.classes.find(possibleClass => possibleClass.name === extend.basicName);
        if (!extendBaseClass) {
            return;
        }
        extendBaseClass.fields.forEach(f => {
            const fieldExistInCreatedClass = baseClass.fields.find(ff => ff.name === f.name);
            if (fieldExistInCreatedClass) {
                return;
            }
            // side effect - update base imports to correct import view file;
            imports.push(...(extendFileStructure._imports|| []));

            fields.push(f);
        });

        if (currentExtendLevel < maxExtendedLevel && extendBaseClass.extends) {
            fields.push(...addExtendClassFieldsToClass(extendBaseClass.extends as Extend[], baseClass, imports,{
                currentExtendLevel: currentExtendLevel + 1,
                maxExtendedLevel
            }))
        }
    })

    return fields;
}

export const createClassMeta = (
    baseClass_: ClassModel,
    {type, mapperPath, model}: GenerateViewOptions,
    imports: ImportNode[],
    path: string,
    maxExtendedLevel: number
) => {
    const baseClass = {...baseClass_};
    const classMeta = new ClassMetadata();
    classMeta.name = upFirstLetter(model);
    classMeta.fields = [];
    classMeta.generateView = true;
    if (mapperPath) {
        classMeta.needMapper = true;
    }

    classMeta.type = type || 'interface';
    classMeta.baseName = baseClass.name;
    classMeta.baseNamePath = path;
    const options = {
        currentExtendLevel: 1,
        maxExtendedLevel
    }
    baseClass.fields.push(...addExtendClassFieldsToClass(baseClass.extends as Extend[], baseClass_, imports, options));
    classMeta.fields = baseClass.fields.map(fld => createFieldMetadata(fld, classMeta, imports));

    classMeta.decorators = [];
    const ignoreClassDecorators = baseClass.decorators.filter(filterOnlyIgnoreDecorators)
    let otherClassDecorators = baseClass.decorators.filter(whiteListClassDecorators);

    if (ignoreClassDecorators.length) {
        ignoreClassDecorators.forEach(ignoreClassDecorator => {
            const [decoratorsToIgnore, modelsWhereDecoratorWillIgnore] = ignoreClassDecorator.arguments as string[][];
            const modelInBlackList = (modelsWhereDecoratorWillIgnore || []).includes(model);
            const classDecorators = otherClassDecorators.filter(d => {
                const decoratorInBlackList = (decoratorsToIgnore || []).includes(d.name)
                return !(decoratorInBlackList && modelInBlackList);
            });
            otherClassDecorators = classDecorators;
        })
    }
    classMeta.decorators = otherClassDecorators;

    const fieldsWithConvertFunctions = classMeta.fields.filter(f => f.fieldConvertFunction);
    fieldsWithConvertFunctions.forEach(f => {
        const func = f.fieldConvertFunction;
        saveInfoAboutTransformer(FuncDirection.toView, func, imports, classMeta);
        saveInfoAboutTransformer(FuncDirection.fromView, func, imports, classMeta);
    });

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
    ignoreDecorators_: Decorator[],
    classMeta: ClassMetadata,
    fldMetadata: FieldMetadata,
    decoratorsOnField: Decorator[],
    imports: ImportNode[],
    ) => {
    const newFldMetadata = {...fldMetadata};
    const ignoreAllDecoratorsExist = ignoreDecorators_.find(d => d.arguments?.length === 0);
    const ignoreDecoratorsForFieldArray = ignoreDecorators_.map(dec => dec.arguments[0]) || [];
    const allIgnoreCustomFields = [];
    ignoreDecoratorsForFieldArray.forEach((d: any) =>  allIgnoreCustomFields.push(...(d || [])));
    const fieldIgnoreDecorators = [...allIgnoreCustomFields, ...ignoreDecorators] as string[];
    const fieldIgnoreDecoratorsClasses = (ignoreDecorators_.map(dec => dec.arguments[1]) || []) as string[];
    if (!decoratorsOnField || !decoratorsOnField.length) {
        newFldMetadata.decorators= [];
        return {
            fieldMetadata: newFldMetadata,
            possibleImports: [],
        };
    }
    const possibleImports: ImportNode[] = [];
    newFldMetadata.decorators = decoratorsOnField.filter(dec => {
        if (ignoreAllDecoratorsExist) {
            return false;
        }
        const isDecoratorAvailableForField = !fieldIgnoreDecorators.includes(dec.name);
        const isDecoratorAvailableForClass = !fieldIgnoreDecoratorsClasses.includes(classMeta.name);
        return isDecoratorAvailableForClass && isDecoratorAvailableForField;
    });

    newFldMetadata.decorators.forEach(dec => {
        const importNode = imports.find(_import => _import.clauses.find(cl => cl === dec.name));
        if (!importNode) {
            return;
        }
        possibleImports.push(importNode);
    })

    newFldMetadata.decorators = newFldMetadata.decorators.map(d => {
        const updatedDecorator = {...d};
        if (updatedDecorator.arguments && updatedDecorator.arguments.length) {
            updatedDecorator.arguments = updatedDecorator.arguments.map(a => {
                if (typeof a === 'object') {
                    return JSON.stringify(a);
                }
                return a;
            })
        }
        return updatedDecorator;
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
    decorators: Decorator[], classMeta: ClassMetadata, flMetadata: FieldMetadata, imports: any) => {
    try {
        if (!decorators || !decorators.length) {
            return { fieldMetadata: flMetadata, possibleImports: [] };
        }
        const updatedFieldMetadata = { ...flMetadata };
        const possibleImports: ImportNode[] = [];
        const decorator = decorators.find(decorator_ => {
            const decoratorArguments: ViewModelTypeOptions = decorator_.arguments[0].valueOf() as any;
            return !decoratorArguments.modelName || decoratorArguments.modelName === classMeta.name
        });
        if (!decorator) {
            return { fieldMetadata: updatedFieldMetadata, possibleImports };
        }
        const fieldTypeOptions = decorator.arguments[0].valueOf() as ViewModelTypeOptions;
        updatedFieldMetadata.nullable = !(fieldTypeOptions && typeof fieldTypeOptions.nullable === 'boolean' && !fieldTypeOptions.nullable);
        updatedFieldMetadata.type = fieldTypeOptions.type.toString();

        const isArray = updatedFieldMetadata.type.indexOf(arrayType) > -1;
        updatedFieldMetadata.isArray = isArray;
        updatedFieldMetadata.type = isArray
            ? updatedFieldMetadata.type.substring(0, updatedFieldMetadata.type.indexOf(arrayType))
            : updatedFieldMetadata.type;

        if ( updatedFieldMetadata.type.toLowerCase() === 'string' && updatedFieldMetadata.type !== updatedFieldMetadata.baseModelType ) {
            updatedFieldMetadata.type = 'string';
            updatedFieldMetadata.toStringWanted = true;
        }

        if (!fieldTypeOptions.transformer) {
            imports.forEach(i => {
                const filteredClauses = i.clauses.filter(clause => clause === updatedFieldMetadata.baseModelType);
                filteredClauses.forEach(clause => {
                    if (i.isNodeModule) {
                        const impNode: ImportNode = { isNodeModule: true, clauses: i.clauses, absPathNode: i.absPathNode, absPathString: i.absPathNode.join('/') };
                        possibleImports.push(impNode);
                        return;
                    }
                    const path = `${(i.absPathNode || []).join('/')}.ts`;
                    const content = fs.readFileSync(path, 'utf-8');
                    const innerJsonStructure = parseStruct(content, {}, '');
                    const filteredClasses = innerJsonStructure.classes.filter(c => c.name === updatedFieldMetadata.baseModelType);
                    filteredClasses.forEach(c => {
                        const generateViewDecorators = c.decorators.filter(d => d.name === Decorators.GenerateView);
                        const sameModelNameDecorators = generateViewDecorators.filter(d => {
                            const generateOptions = d.arguments[0].valueOf() as GenerateViewOptions;
                            const baseType = fieldTypeOptions.type.toString();
                            const viewModelType = fieldTypeOptions.type.toString().indexOf(arrayType) > -1
                                ? baseType.substring(0, fieldTypeOptions.type.toString().indexOf(arrayType))
                                : baseType
                            return generateOptions.model.toLowerCase() === viewModelType.toLowerCase()
                        });

                        sameModelNameDecorators.forEach(d => {
                            const generateOptions = d.arguments[0].valueOf() as GenerateViewOptions;
                            const fileName = `${upFirstLetter(generateOptions.model)}Mapper`;
                            const mapperImport: ImportNode = {
                                isNodeModule: false,
                                clauses: [fileName],
                                absPathNode: [`${generateOptions.mapperPath}/${fileName}`],
                                absPathString: `${generateOptions.mapperPath}/${fileName}`
                            };
                            updatedFieldMetadata.needGeneratedMapper = true;
                            possibleImports.push(mapperImport);
                        });
                    })
                });
            });
        }

        const transformerExistAndNoNeedMapper = fieldTypeOptions.transformer && !updatedFieldMetadata.needGeneratedMapper;
        if (!transformerExistAndNoNeedMapper) {
            return { fieldMetadata: updatedFieldMetadata, possibleImports };
        }

        updatedFieldMetadata.fieldConvertFunction = !updatedFieldMetadata.ignoredInView
            ? fieldTypeOptions.transformer
            : null;

        return { fieldMetadata: updatedFieldMetadata, possibleImports };
    } catch (e) {
        console.error(ConsoleColor.Red, `Generate View: Error: updateFieldMetadataForViewModelTypeDecorator: ${e.message}`);
        throw e;
    }
};


// dirty function - update possible imports;
export const createFieldMetadata = (field: FieldModel, cm: ClassMetadata, imports: ImportNode[]) => {
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
        const fldInfo = getInfoFromImports(imports, typeName);
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
        imports
    );

    fldMetadata = fieldMetadata;
    imports.push(...rest.possibleImports);

    const decUpdate = updateFieldMetadataForIgnoreDecorators(
        fieldDecorators?.filter(decorator => decorator.name === Decorators.IgnoreDecorators),
        cm,
        fldMetadata,
        fieldDecorators?.filter(decorator => !ignoreDecorators.includes(decorator.name)),
        imports,
    );


    fldMetadata = decUpdate.fieldMetadata;

    if (fldMetadata.type !== fldMetadata.baseModelType &&  !baseTypes.includes(fldMetadata.type)) {
        const fldInfo = getInfoFromImports(imports, fldMetadata.type);
        fldMetadata.isComplexType = fldInfo.isComplexType;
        fldMetadata.isEnum = fldInfo.isEnum;
    }

    imports.push(...decUpdate.possibleImports);

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
        fileMetadata.classMetadata.fields.forEach(field => {
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
