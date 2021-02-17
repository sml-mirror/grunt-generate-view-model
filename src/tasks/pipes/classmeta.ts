import { ArrayType, BasicType, Decorator, FieldModel, ImportNode, TypeKind } from "ts-file-parser";
import * as fs from "fs";

import { parseStruct } from "ts-file-parser";
import { getModelNameFromPath, upFirstLetter } from ".";

import { ClassMetadata } from "../model/classmetadata";
import { FieldMetadata } from "../model/fieldmetadata";
import { GenerateViewOptions, ViewModelTypeOptions } from "../../..";
import { Decorators } from "./decorators";
import { ConsoleColor } from "./enums";
import { Import } from "../model/import";
import { FileMetadata } from "../model/filemetadata";
import { unique } from "../pipes";

const arrayType = "[]";
const baseTypes = ["string", "number", "boolean", "undefined", "null", "object"];

export const createClassMeta = (name: string ) => {
    const classMeta = new ClassMetadata();
    classMeta.name = upFirstLetter(name);
    classMeta.fields = [];
    classMeta.generateView = true;
    return classMeta;
};


export const getInfoFromImports = (imports: ImportNode[], typeName: string) => {
    let isComplexType = true;
    let isEnum = false;
    imports.forEach(repeatImport => {
        if (!repeatImport.isNodeModule) {
            repeatImport.clauses.forEach( cl => {
                if (cl === typeName) {
                    let fileName = repeatImport.absPathNode.join("/") + ".ts";
                    let fileContent = fs.readFileSync(fileName, "utf-8");
                    let parsedFile = parseStruct(fileContent, {}, fileName);
                    if ( parsedFile.enumDeclarations) {
                        parsedFile.enumDeclarations.forEach(enm => {
                            if (enm.name === typeName) {
                                isComplexType = false;
                                isEnum = true;
                            }
                        });
                    }
                }
            });
        }
    });

    return {
        isComplexType,
        isEnum
    };
};


export const updateFieldMetadataForIgnoreViewModelDecorator = (decorators: Decorator[], classMeta: any, fldMetadata: FieldMetadata) => {
    if (!decorators || !decorators.length) {
        return fldMetadata;
    }

    const updatedFldMetadata = {...fldMetadata};

    decorators.forEach(decorator => {
        const ignoreViewModelName = decorator.arguments[0];
        const setIgnoreNameToClass = ignoreViewModelName && ignoreViewModelName.toString() === classMeta.name;
        if (setIgnoreNameToClass || !ignoreViewModelName) {
            updatedFldMetadata.ignoredInView = true;
        }
    });

    return updatedFldMetadata;
};

export const updateFieldMetadataForViewModelNameDecorator = (decorators: Decorator[], classMeta: any, fldMetadata: FieldMetadata) => {
    if (!decorators || !decorators.length) {
        return fldMetadata;
    }

    const updatedFldMetadata = {...fldMetadata};

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

export const updateFieldMetadataForViewModelTypeDecorator = (decorators: Decorator[], classMeta: any, flMetadata: FieldMetadata, fileStructure: any) => {
    try {
        if (!decorators || !decorators.length) {
            return {fieldMetadata: flMetadata, possibleImports: []};
        }
        const updatedFieldMetadata = {...flMetadata};
        const possibleImports: ImportNode[] = [];
        decorators.forEach(decorator => {
            let fieldTypeOptions = decorator.arguments[0].valueOf() as ViewModelTypeOptions;
            updatedFieldMetadata.nullable = !(fieldTypeOptions && typeof fieldTypeOptions.nullable === "boolean" && !fieldTypeOptions.nullable);
            if ((fieldTypeOptions.modelName && fieldTypeOptions.modelName === classMeta.name) || (!fieldTypeOptions.modelName )) {

                updatedFieldMetadata.type = fieldTypeOptions.type.toString();
                if (updatedFieldMetadata.type.indexOf(arrayType) > -1) {
                    updatedFieldMetadata.type = updatedFieldMetadata.type.substring(0,  updatedFieldMetadata.type.indexOf(arrayType));
                    updatedFieldMetadata.isArray = true;
                } else {
                    updatedFieldMetadata.isArray = false;
                }
                if ( updatedFieldMetadata.type.toLowerCase() === "string" && updatedFieldMetadata.type !== updatedFieldMetadata.baseModelType ) {
                    updatedFieldMetadata.type = "string";
                    updatedFieldMetadata.toStringWanted = true;
                }
                if (!fieldTypeOptions.transformer) {
                    fileStructure._imports.forEach(i => {
                        i.clauses.forEach(clause => {
                            if (clause === updatedFieldMetadata.baseModelType) {
                                let path: string = "";
                                if ( !i.isNodeModule ) {
                                    i.absPathNode.forEach(node => {
                                        path += `${node}/`;
                                    });
                                    path = path.substring(0, path.length - 1) + ".ts";
                                    let content = fs.readFileSync(path, "utf-8");
                                    let innerJsonStructure = parseStruct(content, {}, "");
                                    innerJsonStructure.classes.forEach(c => {
                                        if (c.name === updatedFieldMetadata.baseModelType) {
                                            c.decorators.forEach(d => {
                                                if (d.name === Decorators.GenerateView) {
                                                    let generateOptions = d.arguments[0].valueOf() as GenerateViewOptions;
                                                    let viewModelType = fieldTypeOptions.type.toString();
                                                    if (fieldTypeOptions.type.toString().indexOf(arrayType) > -1 ) {
                                                        viewModelType = viewModelType.substring(
                                                                0, fieldTypeOptions.type.toString().indexOf(arrayType)
                                                    );
                                                    }
                                                    if (generateOptions.model.toLowerCase() === viewModelType.toLowerCase()) {
                                                        let impNode: ImportNode = {isNodeModule: false, clauses: [], absPathNode: []};
                                                        const {model} = generateOptions;
                                                        let fileName = model[0].toUpperCase() + model.substring(1) + "Mapper";
                                                        impNode.clauses.push(fileName);
                                                        impNode.absPathNode.push(generateOptions.mapperPath + "/" + fileName);
                                                        updatedFieldMetadata.needGeneratedMapper = true;
                                                        possibleImports.push(impNode);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    let impNode: ImportNode = {isNodeModule: true, clauses: i.clauses, absPathNode: i.absPathNode};
                                    possibleImports.push(impNode);
                                }
                            }
                        });
                    });
                }
            }
            if (fieldTypeOptions.transformer && !updatedFieldMetadata.needGeneratedMapper) {
                if (fieldTypeOptions.modelName) {
                    if (!updatedFieldMetadata.ignoredInView && classMeta.name === fieldTypeOptions.modelName ) {
                        updatedFieldMetadata.fieldConvertFunction = fieldTypeOptions.transformer;
                    }
                } else {
                    if (!updatedFieldMetadata.ignoredInView ) {
                        updatedFieldMetadata.fieldConvertFunction = fieldTypeOptions.transformer;
                    }
                }
            }
        });

        return {fieldMetadata: updatedFieldMetadata, possibleImports};
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
    let typeName = fldMetadata.baseModelType;
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
        fldMetadata);

    fldMetadata = updateFieldMetadataForViewModelNameDecorator(
        fieldDecorators.filter(decorator => decorator.name === Decorators.ViewModelName),
        cm,
        fldMetadata);

    const result = updateFieldMetadataForViewModelTypeDecorator(
        fieldDecorators.filter(decorator => decorator.name === Decorators.ViewModelType),
        cm,
        fldMetadata,
        json
    );
    fldMetadata = result.fieldMetadata;

    possibleImports.push(...result.possibleImports);

    return fldMetadata;
};

export const filterFileMetadata = (imports: Import[], classes: ClassMetadata[]) => {
    const newImports = imports.filter(imp => {
        const importArray  = imp.type.slice(1, imp.type.length - 1).trim().split(",");
        if (classes.length > 1) {
            importArray.forEach(item => {
                classes.forEach(cls => {
                    return !(cls.baseName === item);
                });
            });
        }
        return !importArray.find( imp => imp === classes[0].baseName);
    });

    return newImports;
};

export const mapFileClasses = (classes: any[], fileMetadata: FileMetadata) => {
    const mappedClasses = classes.map(cl => {
        const newClass = {...cl};

        newClass.viewModelFromMapper = getModelNameFromPath(fileMetadata.mapperPath, fileMetadata.filename);
        newClass.baseModelFromMapper = getModelNameFromPath(fileMetadata.mapperPath, fileMetadata.basePath);

        return newClass;
    });

    return mappedClasses;
};

export const getDependencyImportsForImports = (_imports: Import[], fileMetadata: FileMetadata) => {
    const mapperFileRegexp = /[a-zA-Z]+Mapper/;
    let imports = [...(_imports || [])];

    imports = imports.map( imp => {
        let dependencyMappers: string[] = [];
        let mapperMatch = imp.type.match(mapperFileRegexp);
        if (mapperMatch) {
            let mapperName = mapperMatch[0];
            fileMetadata.classes.forEach(cls => {
                cls.fields.forEach(field => {
                    const condition = mapperName.includes(field.type) && field.needGeneratedMapper && !field.ignoredInView;
                    if (!condition) {
                        return;
                    }
                    dependencyMappers.push(cls.name);
                });
            });
        }
        dependencyMappers = unique(dependencyMappers);
        imp.dependencyMappers = dependencyMappers;
        return imp;
    });

    return imports;
};
