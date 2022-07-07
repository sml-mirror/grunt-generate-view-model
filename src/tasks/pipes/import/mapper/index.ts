import * as path from 'path';
import { ImportNode } from 'ts-file-parser';

import { Import } from '../../../../tasks/model/import';
import { FieldMetadata } from '../../../../tasks/model/fieldmetadata';
import { FileMetadata } from '../../../../tasks/model/filemetadata';
import { FuncDirection } from '../../../../tasks/pipes/enums';
import { downFirstLetter } from '../../../../tasks/pipes';
import { getDependencyImportsForImports } from '../../../../tasks/pipes/classmeta';



const primitiveTypes = ['string', 'number', 'object', 'any', 'null', 'undefined', 'boolean'];

const getTransformerImportsForField = (fieldMetadata: FieldMetadata) => {
    const imports: string[] = [];
    const isFieldHasTransformerFunctions = fieldMetadata.fieldConvertFunction && !fieldMetadata.ignoredInView;
    if (!isFieldHasTransformerFunctions) {
        return imports;
    }
    [FuncDirection.toView, FuncDirection.fromView].forEach(direction => {
        const directionInfo = fieldMetadata.fieldConvertFunction[direction];
        const isDirectionTypeIsPrimitive = !directionInfo || directionInfo.isPrimitive;
        if (isDirectionTypeIsPrimitive) {
            return;
        }
        const mainClass = (directionInfo.function as string).split('.')[0];
        imports.push(mainClass);
    });

    return imports;
};

const getMapperFieldImportForField = (fieldMetadata: FieldMetadata) => {
    const imports: string[] = [];
    if (fieldMetadata.needGeneratedMapper) {
        imports.push(`${fieldMetadata.type}Mapper`);
    }
    return imports;
};

const getMapperImportsForFields = (fields: FieldMetadata[]) => {
    const imports: string[] = [];
    fields.forEach(field => {
        imports.push(...getTransformerImportsForField(field));
        imports.push(...getMapperFieldImportForField(field));
    });
    return imports;
};

const getContextTypeImports = (meta: FileMetadata, possibleImports: ImportNode[]) => {
    const createImport = (type: string) => {
        if (!type || primitiveTypes.includes(type)) {
            return null;
        }
        const contextImport = new Import();
        contextImport.forMapper = true;
        contextImport.type = type;
        const possibleImport = possibleImports.find(i => i.clauses.find(cl => cl === type));
        if (!possibleImport) {
            return;
        }
        const toPath = possibleImport.absPathNode.join('/');
        const fromPath = meta.mapperPath;
        const arrayPath = path.relative(fromPath, toPath).split('\\');
        const arrayPathLength = arrayPath.length - 1;
        arrayPath[arrayPathLength] = downFirstLetter(arrayPath[arrayPathLength]);
        contextImport.path = arrayPath.join('/');
        if ( contextImport.path.indexOf('./') < 0 && !possibleImport.isNodeModule ) {
            contextImport.path = `./${contextImport.path}`;
        }

        return contextImport;
    };

    const { classMetadata } = meta;
    const imports: Import[] = [];
    const fromViewImport = createImport(classMetadata.contextType.fromView.value);
    if (fromViewImport) {
        imports.push(fromViewImport);
    }
    const toViewImport = createImport(classMetadata.contextType.toView.value);
    if (toViewImport) {
        imports.push(toViewImport);
    }
    return imports;
};


export const getMapperImports = (fileMetadata: FileMetadata, imports: ImportNode[]) => {
    let mapperImports: string[] = [];
    const resultMapperImports: Import[] = [];

    mapperImports = getMapperImportsForFields(fileMetadata.classMetadata.fields);
    mapperImports.forEach(mapperImport => {
        const importNode = imports.find(nodeImport => {
            return nodeImport.clauses.includes(mapperImport);
        });

        if (!importNode) {
            return;
        }
        const imp = new Import();
        imp.forMapper = true;
        imp.type = mapperImport;
        const toPath = importNode.absPathNode.join('/');
        const fromPath = fileMetadata.mapperPath;// fileMetadata.filename.split('.ts').join('');
        const arrayPath = path.relative(fromPath, toPath).split('\\');
        const arrayPathLength = arrayPath.length - 1;
        arrayPath[arrayPathLength] = downFirstLetter(arrayPath[arrayPathLength]);
        imp.path = arrayPath.join('/');
        if ( imp.path.indexOf('./') < 0 && !importNode.isNodeModule ) {
            imp.path = `./${imp.path}`;
        }
        resultMapperImports.push(imp);
    });

    // @@
    //
    //  получение импортов для сгенерированных мапперов
    //
    const generatedImports = getDependencyImportsForImports(resultMapperImports, fileMetadata);
    generatedImports.forEach(generatedImport => {
        const isMapperImportExistInImports = fileMetadata.imports.find(_import => _import.type.includes(generatedImport.type));
        if (isMapperImportExistInImports) {
            return;
        }
        resultMapperImports.push(generatedImport);
    });

    // @@
    //
    // Получение путей для типов контекста в трансформерах
    //

    const contextTypeImports = getContextTypeImports(fileMetadata, imports);
    contextTypeImports.forEach(generatedImport => {
        const isMapperImportExistInImports = fileMetadata.imports.find(_import => _import.type.includes(generatedImport.type));
        if (isMapperImportExistInImports) {
            return;
        }
        resultMapperImports.push(generatedImport);
    });

    return resultMapperImports;
};
