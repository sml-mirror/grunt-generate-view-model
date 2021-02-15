import * as fs from "fs";
import * as path from "path";
import {parseStruct, ImportNode} from "ts-file-parser";
import {render, configure} from "nunjucks";

import { Import } from "./model/import";
import { Config } from "./model/config";
import {FileMetadata} from "./model/filemetadata";
import {ClassMetadata} from "./model/classmetadata";
import {Options, FileMapping} from "./model/options";
import { GenerateViewOptions } from "./model/generateViewOptions";
import { Transformer } from "./model/transformer";

import { downFirstLetter, getModelNameFromPath } from "./pipes";
import { Decorators } from "./pipes/decorators";
import { asyncDirection, ConsoleColor, FuncDirection } from "./pipes/enums";
import { createClassMeta, createFieldMetadata, } from "./pipes/classmeta";
import { FieldMetadata } from "./model/fieldmetadata";

const mkdirp = require("mkdirp");
const primitiveTypes = ["string", "number", "object", "any" , "null", "undefined"];

const configName = "genconfig.json";

export function createViewModelsInternal(): string [] {
    const dateStart = Date.now();
    let config: Config = JSON.parse(fs.readFileSync(configName, "utf8"));
    const possibleFiles = getAllFiles(config.check.folders);
    const metadata = createMetadatas(possibleFiles);
    const resultTemplate = createFiles(metadata);
    const dateEnd = Date.now();

    console.log(ConsoleColor.Green, `Generate View: Count of files: ${possibleFiles.length}`);
    console.log(`Generate View: Execution time: ${dateEnd - dateStart}ms`);
    console.log(ConsoleColor.Default);
    return resultTemplate;
}

export function createOptionsOfGrunt(obj: IGrunt): Options {
    const options = new Options();
    const filesLength = obj.task.current.files.length;
    const files: FileMapping[] = [];
    for (let i = 0; i < filesLength; i++) {
        let file: FileMapping = {
            source: obj.task.current.files[i].src[0],
            destination: obj.task.current.files[i].dest
        };
        files.push(file);
    }

    options.files = files;
    return options;
}

export function createMetadatas(files: string[]): FileMetadata[] {
    let generationFiles: FileMetadata[] = [];
    for (let file of files) {
        const stringFile = fs.readFileSync(file, "utf-8");
        const jsonStructure = parseStruct(stringFile, {}, file);
        let possibleImports = jsonStructure._imports || [];

        jsonStructure.classes.forEach(cls => {
            const generateViewDecorators = (cls.decorators || []).filter(dec => dec.name === Decorators.GenerateView);

            if (!generateViewDecorators.length) {
                return;
            }

            const classMets = generateViewDecorators.map(dec => {
                let genViewOpt = dec.arguments[0].valueOf() as GenerateViewOptions;
                const classMeta = createClassMeta(genViewOpt.model);
                FillFileMetadataArray(generationFiles, genViewOpt, file);
                return classMeta;
            });

            classMets.forEach(cm => {
                cm.baseName = cls.name;
                cm.baseNamePath =  file;
                cls.fields.forEach(fld => {
                    const fieldMetadata = createFieldMetadata(fld, jsonStructure, cm, possibleImports);
                    cm.fields.push(fieldMetadata);
                });

                const fieldsWithConvertFunctions = cm.fields.filter(f => f.fieldConvertFunction);

                fieldsWithConvertFunctions.forEach(f => {
                    let func = f.fieldConvertFunction;
                    saveInfoAboutTransformer(FuncDirection.toView, func, possibleImports, cm);
                    saveInfoAboutTransformer(FuncDirection.fromView, func, possibleImports, cm);
                });
            });

            generationFiles.forEach(genFile => {
                classMets.forEach( cm => {
                    const classMetaFileName = `${downFirstLetter(cm.name)}.ts`;
                    if (genFile.filename.indexOf(classMetaFileName) > -1) {
                        genFile.classes.push(cm);
                    }
                });
                makeCorrectImports(genFile, possibleImports);
            });
        });
    }
    return generationFiles.filter(file => file.filename);
}

export function createFiles(metadata: FileMetadata[]): string [] {
    let viewsFolder = path.resolve(__dirname, "view/");
    configure(viewsFolder, {autoescape: true, trimBlocks : true});

    let res: string [] = [];
    let c = null;
    for ( let i = 0; i < metadata.length; i++ ) {
        let mdata = metadata[i];
        mdata.classes = mdata.classes.filter(item => item.generateView);
        if (mdata.mapperPath) {
            mdata.classes.forEach(cl => {
                cl.viewModelFromMapper = getModelNameFromPath(mdata.mapperPath, mdata.filename);
                cl.baseModelFromMapper = getModelNameFromPath(mdata.mapperPath, mdata.basePath);
            });
        }
        mdata.imports = mdata.imports.filter(imp => {
            const importArray  = imp.type.slice(1, imp.type.length - 1).trim().split(",");
            if (mdata.classes.length > 1) {
                importArray.forEach(item => {
                    mdata.classes.forEach(cls => {
                        return !(cls.baseName === item);
                    });
                });
            }
            return !importArray.find( imp => imp === mdata.classes[0].baseName);
        });
        c = render("viewTemplateCommon.njk", {metafile: mdata});
        let createdMapperFileContent = render("mapperTemplate.njk", {metafile: mdata});
        if (c && c.trim()) {
            const getDirName = path.dirname;
            mkdirp.sync(getDirName(mdata.filename));
            fs.writeFileSync(mdata.filename, c, "utf-8");
            res.push(c);

            let needMapper = !mdata.classes.some(cls => !cls.needMapper);

            if (needMapper) {
                let pathArray = mdata.filename.split(".ts").join("").split("/");
                const mapperModelName = pathArray[pathArray.length - 1];
                const mapperFilename = `${mdata.mapperPath}/${mapperModelName}Mapper.ts`;
                mkdirp.sync(mdata.mapperPath);
                fs.writeFileSync( mapperFilename, createdMapperFileContent, "utf-8");
                res.push(createdMapperFileContent);
            }
        }
    }

    return c;
}

function saveInfoAboutTransformer(direction: FuncDirection, func: Transformer, possibleImports: ImportNode[], cm: ClassMetadata) {
    if (!direction) {
        return;
    }
    const isTransformFunctionExist = func[direction] && func[direction].function;
    if (!isTransformFunctionExist) {
        return;
    }
    const importFunctionName = func[direction].function;
    const moduleImport = possibleImports.find(possibleImport => possibleImport.clauses.indexOf(importFunctionName) > -1);
    if (moduleImport) {
        let stringFile = "";
        let pathFromFile = moduleImport.absPathNode.join("/");
        const getContentFrom = (from: string) => {
            stringFile = fs.readFileSync(path.resolve(pathFromFile + from)).toString();
            pathFromFile = `${pathFromFile}${from}`;
        };

        try {
            getContentFrom(".ts");
        } catch (e) {
            getContentFrom("/index.ts");
        }

        const jsonStructure = parseStruct(stringFile, {}, pathFromFile);
        const { functions } = jsonStructure;

        const targetFuncs = functions.find(func => func.name === importFunctionName);
        func[direction].isAsync = targetFuncs.isAsync;
        const asyncDirect = asyncDirection[direction];
        if (!cm[asyncDirect]) {
            cm[asyncDirect] = targetFuncs.isAsync;
        }
        func[direction].isPrimitive = false;
        const contextTypeOfTransformer = targetFuncs.params[1] && targetFuncs.params[1].type || null;
        const contextMandatoryOfType = targetFuncs.params[1] && targetFuncs.params[1].mandatory || false;
        const directionValueInfo = cm.contextType[direction];
        if (!contextTypeOfTransformer) {
            return;
        }
        if (!directionValueInfo.value || directionValueInfo.value === contextTypeOfTransformer || contextTypeOfTransformer === "any") {
            directionValueInfo.value = contextTypeOfTransformer;
            directionValueInfo.mandatory = contextMandatoryOfType || directionValueInfo.mandatory;
            const fieldsWithContext =  cm.fields.filter(f => f.fieldConvertFunction && f.fieldConvertFunction[direction]);
            fieldsWithContext.forEach(f => {
                const funcToRecognize =  functions.find(func => func.name === f.fieldConvertFunction[direction].function);
                const isFuncsWithParams = funcToRecognize && funcToRecognize.params && funcToRecognize.params[1];
                if (!isFuncsWithParams) {
                    return;
                }
                cm.contextTypeFields[direction].push(f.name);
            });
        } else {
            throw new Error("Context for one-side mapper should be of one type or any");
        }
        const isPrimitiveType = !!primitiveTypes.find(type => type === directionValueInfo.value );
        if (isPrimitiveType) {
            return;
        }
        const contextTypeImport = jsonStructure._imports.find(imp => !!imp.clauses.find(clause =>  directionValueInfo.value === clause));
        possibleImports.push({
            clauses: [directionValueInfo.value],
            absPathNode: contextTypeImport.absPathNode,
            isNodeModule: false
        });
        return;
    }
    func[direction].isPrimitive = true;
    if ( func[direction].function !== "null" && func[direction].function !== "undefined") {
        func[direction].isPrimitiveString = isNaN(+func[direction].function);
    } else {
        func[direction].isPrimitiveString = false;
    }
}


function FillFileMetadataArray(generationFiles: FileMetadata[], genViewOpt: GenerateViewOptions, file: string) {
    let fileMet : FileMetadata;
    fileMet = new FileMetadata();
    fileMet.basePath = file;
    fileMet.classes = [];
    const {filePath, model} = genViewOpt;
    fileMet.filename = `${filePath}/${model[0].toLowerCase()}${model.substring(1)}.ts`;
    fileMet.mapperPath = genViewOpt.mapperPath;
    generationFiles.push( fileMet);
    return fileMet ;
}

const getInfoFromClassField = (classField: FieldMetadata) => {

    const usingTypesInClass: string[] = [];
    const importsForMapper: string[] = [];
    if ( classField.fieldConvertFunction && !classField.ignoredInView) {
        [FuncDirection.toView, FuncDirection.fromView].forEach(direction => {
            const directionInfo = classField.fieldConvertFunction[direction];
            if (directionInfo && directionInfo.isPrimitive) {
                let mainClass = directionInfo.function.split(".")[0];
                usingTypesInClass.push(mainClass);
                importsForMapper.push(mainClass);
            }
        });
    }
    if (classField.needGeneratedMapper) {
        usingTypesInClass.push(`${classField.type}Mapper`);
        importsForMapper.push(`${classField.type}Mapper`);
    }
    return {
        usingTypesInClass,
        importsForMapper
    };
};



function makeCorrectImports(fileMetadata: FileMetadata , imports: ImportNode[]) {
    fileMetadata.classes.forEach(cls => {
        let usingTypesInClass = unique(cls.fields
            .filter(fld => !fld.ignoredInView)
            .map(fld => fld.type));
        let indexesOfCorrectImports: number[] = [];
        let importsForMapper: string[] = [];
        const classFields = cls.fields;
        const mapResult = classFields.map(getInfoFromClassField).forEach(info => {
            usingTypesInClass.push(...info.usingTypesInClass);
            importsForMapper.push(...info.importsForMapper);
        });
        if (cls.contextType.fromView && !primitiveTypes.find(type => cls.contextType.fromView.value === type)) {
            importsForMapper.push(cls.contextType.fromView.value);
            imports.forEach((ind, j) => {
                if (ind.clauses.find( clause => clause === cls.contextType.fromView.value)) {
                    indexesOfCorrectImports.push(j);
                }
            });
        }
        if (cls.contextType.toView && !primitiveTypes.find(type => cls.contextType.toView.value === type)) {
            importsForMapper.push(cls.contextType.toView.value);
            imports.forEach((ind, j) => {
                if (ind.clauses.find( clause => clause === cls.contextType.toView.value)) {
                    indexesOfCorrectImports.push(j);
                }
            });
        }
        usingTypesInClass.forEach(type => {
            for ( let ind = 0; ind < imports.length; ind++) {
                if ( imports[ind].clauses.indexOf(type) > -1) {
                    indexesOfCorrectImports.push(ind);
                }
            }
        });
        const uniqueIndexesOfCorrectImports: Set<number> = new Set(indexesOfCorrectImports);
        uniqueIndexesOfCorrectImports.forEach(ind => {
            let imp = new Import();
            imp.type = `{ ${imports[ind].clauses.join(",")} }`;
            let toPath = imports[ind].absPathNode.join("/");
            let fromPath = fileMetadata.filename.split(".ts").join("");
            let _path: string = toPath;
            if (!imports[ind].isNodeModule) {
                const from = path.dirname(fromPath);
                _path = path.relative(from, toPath).split("\\").join("/");
                if ( _path.indexOf("./") < 0 ) {
                _path = "./" + _path;
                }
            }
            imp.path = _path;
            importsForMapper.forEach( impForMapper => {
                if (imports[ind].clauses.indexOf(impForMapper) > -1) {
                    fromPath = fileMetadata.mapperPath;
                    let arrayPath = path.relative(fromPath, toPath).split("\\");
                    arrayPath[arrayPath.length - 1] = downFirstLetter(arrayPath[arrayPath.length - 1]);
                    imp.path = arrayPath.join("/");
                    if ( imp.path.indexOf("./") < 0 && !imports[ind].isNodeModule ) {
                        imp.path = "./" + imp.path;
                    }
                    imp.forMapper = true;
                }
            });

            fileMetadata.imports.push(imp);
        });
    });
    let tmpImports : Import[] = [];
    fileMetadata.imports.forEach( i => {
        const isExist = !!tmpImports.find(ti => ti.type === i.type);
        if (!isExist) {
            tmpImports.push(i);
        }
    });
    fileMetadata.imports = tmpImports;
    fileMetadata.imports = FilterImportingMappers(fileMetadata);
    fileMetadata.imports = filterTransformerWhichAlreadyExistInMapper(fileMetadata.imports);
}

function FilterImportingMappers(meta: FileMetadata) {
    const imports = meta.imports;
    imports.forEach( imp => {
        let mapperMatch = imp.type.match(/[a-zA-Z]+Mapper/);
        if (mapperMatch) {
            let mapperName = mapperMatch[0];
            meta.classes.forEach(cls => {
                cls.fields.forEach(field => {
                    if (mapperName.includes(field.type) && field.needGeneratedMapper && !field.ignoredInView) {
                        imp.dependencyMappers.push(cls.name);
                    }
                });
            });
        }
        imp.dependencyMappers = unique(imp.dependencyMappers);
    });
    return imports;
}

function filterTransformerWhichAlreadyExistInMapper(imports: Import[]) {
    const tmpImports = imports;
    const newImports: Import[] = [];
    tmpImports.forEach(imp => {
        if (newImports.length === 0) {
            newImports.push(imp);
            return;
        }
        const newImportsSamePathImports = newImports.find(_import => _import.path === imp.path);
        if (!newImportsSamePathImports) {
            newImports.push(imp);
            return;
        }
        const targetImportClauses = imp.type.replace("{", "").replace("}", "").trim().split(",");
        const commonArrayOfClauses = Array.from(new Set([...targetImportClauses]));
        newImportsSamePathImports.type = `{ ${commonArrayOfClauses.join(",")}}`;
    });
    return newImports;
}

function unique(arr: string[]): string[] {
    let obj = {};

    for (var i = 0; i < arr.length; i++) {
      var str = arr[i];
      obj[str] = true;
    }
    return Object.keys(obj);
}

function getAllFiles(checkingFolders: string[] = []) {
    let tsRegExp = /.+\.ts$/;
    const returnFiles: string[] = [];

    checkingFolders.forEach(folderPath => {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
            const endPath = `${folderPath}/${file}`;
            let matches = tsRegExp.exec(endPath);
            const isAnyMatches = matches && matches.length > 0;
            const isPathIdDirectory = fs.statSync(endPath).isDirectory();
            if (isPathIdDirectory) {
                const subFiles = getAllFiles([endPath]);
                returnFiles.push(...subFiles);
            } else if (isAnyMatches) {
                returnFiles.push(matches[0]);
            }
        });
    });
    return returnFiles;
}