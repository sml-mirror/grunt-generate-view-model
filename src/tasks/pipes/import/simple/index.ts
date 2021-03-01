import * as path from 'path';

import { ImportNode } from "ts-file-parser";

import { FileMetadata } from "../../../../tasks/model/filemetadata";
import { ignoreDecorators } from '../../../../tasks/constants/ignoreDecorators';
import { Import } from "../../../../tasks/model/import";

const getSearchingImportsName = (fileMetadata: FileMetadata) => {
    const importsToSearch: string[] = [];

    fileMetadata.classes.forEach(cls => {
        cls.fields.forEach(fld => {
            const isFieldIsPrimitive = !fld.isComplexType && !fld.isEnum;
            const isImportInclude = importsToSearch.includes(fld.type)
            const isGlobalImportInclude = fileMetadata.imports.find(i => i.type === fld.type);
            if (isFieldIsPrimitive || isImportInclude || isGlobalImportInclude) {
                return;
            }
            importsToSearch.push(fld.type)
        })
    });

    return importsToSearch;
}

export const getDecoratorImports = (fileMetadata: FileMetadata, imports: ImportNode[]) => {
    const result: Import[] = [];
    const decorators: string[] = [];
    fileMetadata.classes.forEach(cls => {
        cls.fields.forEach(fld => {
            decorators.push(...fld.decorators.filter(dec => !ignoreDecorators.includes(dec.name)).map(d => d.name))
        });
    });
    imports.forEach(imprt => {
        if (decorators.find(dec => imprt.clauses.find(c => c.includes(dec)))) {
            const nodeImport = new Import();
            nodeImport.path = imprt.absPathNode.join('/');
            nodeImport.forMapper = false;
            nodeImport.type = imprt.clauses.join(',');
            result.push(nodeImport);
        }
    })
    return result;
}

export const getInterfaceImports = (fileMetadata: FileMetadata, imports: ImportNode[]) => {
    const result: Import[] = [];
    const importsToSearch = getSearchingImportsName(fileMetadata);
    const fromPath = fileMetadata.filename.split('.ts').join('');

    importsToSearch.forEach(searchImport => {
        const importToReturn = new Import();
        importToReturn.type = searchImport;
        const importNode = imports.find(imp => imp.clauses.find(cl => cl === searchImport));
        if (!importNode) {
            return;
        }
        if (importNode.isNodeModule) {
            importToReturn.path = importNode.absPathNode.join('/');
        } else {
            const toPath = importNode.absPathNode.join('/');
            const from = path.dirname(fromPath);
            const _path = path.relative(from, toPath).split('\\').join('/');
            importToReturn.path = _path.indexOf('./') < 0 ? `./${_path}` : _path;
        }
        result.push(importToReturn);
    });

    // find same class as import in view model
    fileMetadata.classes.forEach(cls => {
        const modelName = cls.baseName;
        const fieldWithBaseType = cls.fields.find(fld => fld.type === modelName);
        if (!fieldWithBaseType) {
            return;
        }

        if (result.find(item => item.type === modelName)) {
            return;
        }

        if (imports.find(imp => imp.clauses.includes(modelName))) {
            return;
        }

        const sameImport = new Import();
        sameImport.type = modelName;
        const to = cls.baseNamePath.replace('.ts', '');
        const from = fileMetadata.filename.replace('.ts', '')
            .split('/')
            .map((p,i, self) => {
                if (i === self.length -1) {
                    return null;
                }
                return p;
            })
            .filter(o => o).join('/');

        sameImport.path = path.relative(from, to).replace(/\\/g, '/')
        result.push(sameImport);
    })
    return result;
}


