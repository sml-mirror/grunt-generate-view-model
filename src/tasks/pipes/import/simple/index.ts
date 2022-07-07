import * as path from 'path';

import { ImportNode } from "ts-file-parser";

import { FileMetadata } from "../../../../tasks/model/filemetadata";
import { ignoreDecorators } from '../../../../tasks/constants/ignoreDecorators';
import { Import } from "../../../../tasks/model/import";

const getSearchingImportsName = ({classMetadata, imports}: FileMetadata) => {
    const importsToSearch: string[] = [];

    classMetadata.fields.forEach(fld => {
        const isFieldIsPrimitive = !fld.isComplexType && !fld.isEnum;
        const isImportInclude = importsToSearch.includes(fld.type)
        const isGlobalImportInclude = imports.find(i => i.type === fld.type);
        if (isFieldIsPrimitive || isImportInclude || isGlobalImportInclude) {
            return;
        }

        if (fld.ignoredInView) {
            return;
        }
        importsToSearch.push(fld.type)
    })

    return importsToSearch;
}

export const getDecoratorImports = (fileMetadata: FileMetadata, imports: ImportNode[]) => {
    const result: Import[] = [];
    let decorators: string[] = [];
    const cls = fileMetadata.classMetadata;
    
    decorators.push(...cls.decorators.map(d => d.name))

    cls.fields.forEach(fld => {
        const filteredDecorators = fld.decorators.filter(dec => !ignoreDecorators.includes(dec.name));
        decorators.push(...filteredDecorators.map(d => d.name))
    });

    decorators = Array.from(new Set(decorators));

    imports.forEach(imprt => {
        const needImport = decorators.find(dec => imprt.clauses.find(c => c.includes(dec)));
        if (!needImport) {
            return;
        }
        const nodeImport = new Import();
        nodeImport.path = imprt.absPathNode.join('/');
        nodeImport.forMapper = false;
        nodeImport.type = imprt.clauses.filter(clause => decorators.includes(clause)).join(',');
        result.push(nodeImport);
    })
    return result;
}

export const getInterfaceImports = (fileMetadata: FileMetadata, imports: ImportNode[]) => {
    const importsToSearch = getSearchingImportsName(fileMetadata);
    const fromPath = fileMetadata.filename.split('.ts').join('');

    let result = importsToSearch.map(searchImport => {
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
        return importToReturn;
    }).filter(r => !!r);
    // find same class as import in view model
    const { classMetadata } = fileMetadata;
    const modelName = classMetadata.baseName;
    const fieldWithTypeLikeBaseName = classMetadata.fields.find(fld => fld.type === modelName);

    if (fieldWithTypeLikeBaseName) {
        const sameImport = new Import();
        sameImport.type = modelName;
        const to = classMetadata.baseNamePath.replace('.ts', '');
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
    }
    return result;
}


