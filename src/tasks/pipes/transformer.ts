import * as fs from 'fs';
import * as path from 'path';

import { ImportNode, parseStruct } from "ts-file-parser";
import { asyncDirection, FuncDirection } from "./enums";
import { primitiveTypes } from "../../tasks/constants/primitiveTypes";
import { ClassMetadata } from "../../tasks/model/classmetadata";
import { Transformer } from '../../tasks/model/transformer';

export const saveInfoAboutTransformer = (direction: FuncDirection, func: Transformer, possibleImports: ImportNode[], cm: ClassMetadata) => {
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
        const contextObject = targetFuncs.params[1];
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
            absPathString: contextTypeImport.absPathNode.join('/'),
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
