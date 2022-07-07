import Module from "module";
import { Import } from "tasks/model/import";
import { ClassModel, ImportNode } from "ts-file-parser";

import { FileMetadata } from "../../../tasks/model/filemetadata";

import { getMapperImports } from "./mapper";
import { getDecoratorImports, getInterfaceImports } from "./simple";

const deleteRepeatableImports = (imports: ImportNode[]) => {
    const filteredImports: ImportNode[] = [];
    imports.forEach(i => {
        const alreadyInFilterImport = filteredImports.find(filteredImport => filteredImport.clauses.toString() === i.clauses.toString());
        if (alreadyInFilterImport) {
            return;
        }
        filteredImports.push(i);
    });
    return filteredImports;
}


export const makeCorrectImports = (fileMetadata: FileMetadata, possibleImports: ImportNode[]) => {
    const imports = deleteRepeatableImports(possibleImports);
    const mapperImports = getMapperImports(fileMetadata, imports);
    const interfaceImports = getInterfaceImports(fileMetadata, imports);
    let decoratorImports: Import[] = [];
    if (fileMetadata.classMetadata.type === 'class' ) {
        decoratorImports = getDecoratorImports(fileMetadata, imports);
    }

    const result: Import[] = [...mapperImports, ...interfaceImports, ...decoratorImports]
        .filter(imp => !fileMetadata.imports.find(i => i.type === imp.type))
        .reduce((prev, cur) => {
            const pathExistInPrev = !!prev.find(item => cur.path === item.path)
            if (!pathExistInPrev) {
                return [...prev, cur];
            }
            const newArray = prev.map(item => {
                if (item.path !== cur.path || item.type.includes(cur.type)) {
                    return item;
                }
                item.type = `${item.type}, ${cur.type}`
                return item;
            })
            return newArray;
        }, []);
    result.sort((a, b) => {
        const isAIsNodeModule = !a.path.startsWith('.')
        const isBIsNodeModule = !b.path.startsWith('.')
        if (isAIsNodeModule && !isBIsNodeModule) {
            return -1;
        }
        if (isBIsNodeModule && !isAIsNodeModule) {
            return 1;
        }

        const aImport = `import { ${a.type} } from '${a.path}'`;
        const bImport = `import { ${b.type} } from '${b.path}'`;
        return aImport.length - bImport.length
    });
    return result;
}
