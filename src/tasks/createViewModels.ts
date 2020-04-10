import * as fs from "fs";
import * as path from "path";
import {parseStruct, ImportNode} from "ts-file-parser";
import {ArrayType, BasicType} from "ts-file-parser";
import {render, configure} from "nunjucks";

import { Import } from "./model/import";
import { Config } from "./model/config";
import {FileMetadata} from "./model/filemetadata";
import {ClassMetadata} from "./model/classmetadata";
import {FieldMetadata} from "./model/fieldmetadata";
import {Options, FileMapping} from "./model/options";
import { ViewModelTypeOptions } from "./model/viewModelTypeOptions";
import { GenerateViewOptions } from "./model/generateViewOptions";
import { Transformer } from "./model/transformer";
import { isBoolean } from "util";

const mkdirp = require("mkdirp");
const arrayType = "[]";
const primitiveTypes = ["string", "number", "object", "any" , "null", "undefined"];

export function createViewModelsInternal(): string [] {
    let possibleFiles: string[] = [];
    let config = <Config>JSON.parse(fs.readFileSync("genconfig.json", "utf8"));
    getAllfiles(".", possibleFiles, config.check.folders);
    const  metadata = createMetadatas(possibleFiles);
    const resultTemplate = CreateFiles(metadata);
    return resultTemplate;
}

export function createOptionsOfGrunt(obj: IGrunt): Options {
    var options = new Options();
    var files = new Array<FileMapping>();
    for (var i = 0; i < obj.task.current.files.length; i++) {
        var file = new FileMapping();
        file.source = obj.task.current.files[i].src[0];
        file.destination = obj.task.current.files[i].dest;
        files.push(file);
    }

    options.files = files;
    return options;
}

export function createMetadatas(files: string[]): FileMetadata[] {
    let generationFiles: FileMetadata[] = [];
    for (let file of files) {
        var stringFile = fs.readFileSync(file, "utf-8");
        var jsonStructure = parseStruct(stringFile, {}, file);
        let possibleImports = jsonStructure._imports;

        jsonStructure.classes.forEach(cls => {
            let classMet = new ClassMetadata();
            let classMets = new Array<ClassMetadata>();

            classMet.name = cls.name;
            classMet.fields = new Array<FieldMetadata>();
            let fileMet: FileMetadata = null;
            cls.decorators.forEach(dec => {
                if (dec.name === "GenerateView") {
                    let genViewOpt = <GenerateViewOptions>dec.arguments[0].valueOf();
                    if (classMet.generateView === false) {
                        classMet.generateView = true;
                        classMet.name = genViewOpt.model;
                        classMet.name = classMet.name[0].toUpperCase() + classMet.name.substring(1);
                        if (genViewOpt.mapperPath) {
                            classMet.needMapper = true;
                        }
                        classMets.push(classMet);

                        fileMet = FillFileMetadataArray(generationFiles, genViewOpt, file);
                    } else {
                        let otherClassMet = new ClassMetadata();
                        otherClassMet.generateView = true;
                        otherClassMet.name = genViewOpt.model;
                        otherClassMet.name = otherClassMet.name[0].toUpperCase() + otherClassMet.name.substring(1);
                        otherClassMet.fields = new Array<FieldMetadata>();
                        if (genViewOpt.mapperPath) {
                            otherClassMet.needMapper = true;
                        }
                        classMets.push(otherClassMet);

                        fileMet = FillFileMetadataArray(generationFiles, genViewOpt, file);
                    }
                }
            });
            if (!classMet.generateView) {
                return;
            }
            classMets.forEach(cm => {
                cm.baseName = cls.name;
                cm.baseNamePath =  file;
                cls.fields.forEach(fld => {
                    let fldMetadata = new FieldMetadata();
                    fldMetadata.baseModelName = fld.name;
                    fldMetadata.nullable = true;
                    if (fld.type.typeKind === 1) {
                        fldMetadata.isArray = true;
                    }
                    if ((<ArrayType>fld.type).base !== undefined) {
                        fldMetadata.baseModelType = (<BasicType>(<ArrayType>fld.type).base).typeName;
                        var curBase = (<ArrayType>fld.type).base;
                        while ((<ArrayType>curBase).base !== undefined) {
                            curBase = (<ArrayType>curBase).base;
                            fldMetadata.baseModelType = (<BasicType>curBase).typeName;
                        }
                    } else {
                        fldMetadata.baseModelType = (<BasicType>fld.type).typeName;
                    }
                    let typeName = fldMetadata.baseModelType;
                    const baseTypes = ["string", "number", "boolean", "undefined", "null", "object"];
                    if ( !baseTypes.find(type => type === typeName)) {
                        fldMetadata.isComplexType = true;
                        possibleImports.forEach(repeatImport => {
                            if (!repeatImport.isNodeModule) {
                                repeatImport.clauses.forEach( cl => {
                                    if (cl === typeName) {
                                        let fN = repeatImport.absPathNode.join("/") + ".ts";
                                        let c = fs.readFileSync(fN, "utf-8");
                                        let iJStructure = parseStruct(c, {}, fN);
                                        if ( iJStructure.enumDeclarations) {
                                            iJStructure.enumDeclarations.forEach(enm => {
                                                if (enm.name === typeName) {
                                                    fldMetadata.isComplexType = false;
                                                    fldMetadata.isEnum = true;
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                    fldMetadata.name = fld.name;
                    fldMetadata.type = fldMetadata.baseModelType;
                    fld.decorators.forEach(dec => {
                        if (dec.name === "IgnoreViewModel") {
                            if (dec.arguments[0] && dec.arguments[0].toString() === cm.name) {
                                fldMetadata.ignoredInView = true;
                            } else if (!dec.arguments[0]) {
                                fldMetadata.ignoredInView = true;
                            }
                        }
                        if (dec.name === "ViewModelName") {
                            if (dec.arguments[1] && dec.arguments[1].toString() === cm.name) {
                                fldMetadata.name = dec.arguments[0].toString();
                            } else if (!dec.arguments[1]) {
                                fldMetadata.name = dec.arguments[0].toString();
                            }
                        }
                        if (dec.name === "ViewModelType") {
                            let fieldTypeOptions = <ViewModelTypeOptions>dec.arguments[0].valueOf();
                            fldMetadata.nullable = !(fieldTypeOptions && isBoolean(fieldTypeOptions.nullable) && !fieldTypeOptions.nullable);
                            if ((fieldTypeOptions.modelName && fieldTypeOptions.modelName === cm.name) || (!fieldTypeOptions.modelName )) {

                                fldMetadata.type = fieldTypeOptions.type.toString();
                                if (fldMetadata.type.indexOf(arrayType) > -1) {
                                    fldMetadata.type = fldMetadata.type.substring(0,  fldMetadata.type.indexOf(arrayType));
                                    fldMetadata.isArray = true;
                                } else {
                                    fldMetadata.isArray = false;
                                }
                                if ( fldMetadata.type.toLowerCase() === "string" && fldMetadata.type !== fldMetadata.baseModelType ) {
                                    fldMetadata.type = "string";
                                    fldMetadata.toStringWanted = true;
                                }
                                if (!fieldTypeOptions.transformer) {
                                    jsonStructure._imports.forEach(i => {
                                        i.clauses.forEach(clause => {
                                            if (clause === fldMetadata.baseModelType) {
                                                let path: string = "";
                                                if ( !i.isNodeModule ) {
                                                    i.absPathNode.forEach(node => {
                                                        path += `${node}/`;
                                                    });
                                                    path = path.substring(0, path.length - 1) + ".ts";
                                                    let content = fs.readFileSync(path, "utf-8");
                                                    let innerJsonStructure = parseStruct(content, {}, "");
                                                    innerJsonStructure.classes.forEach(c => {
                                                        if (c.name === fldMetadata.baseModelType) {
                                                            c.decorators.forEach(d => {
                                                                if (d.name === "GenerateView") {
                                                                    let generateOptions = <GenerateViewOptions>d.arguments[0].valueOf();
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
                                                                        fldMetadata.needGeneratedMapper = true;
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
                            if (fieldTypeOptions.transformer && !fldMetadata.needGeneratedMapper) {
                                if (fieldTypeOptions.modelName) {
                                    if (!fldMetadata.ignoredInView && cm.name === fieldTypeOptions.modelName ) {
                                        fldMetadata.fieldConvertFunction = fieldTypeOptions.transformer;
                                    }
                                } else {
                                    if (!fldMetadata.ignoredInView ) {
                                        fldMetadata.fieldConvertFunction = fieldTypeOptions.transformer;
                                    }
                                }
                            }
                        }
                    });
                    cm.fields.push(fldMetadata);
                });
                cm.fields.forEach(f => {
                    if (f.fieldConvertFunction) {
                         let func = f.fieldConvertFunction;
                         if (func.toView && func.toView.function) {
                                saveInfoAboutTransformer("toView", func, possibleImports, cm);
                         }
                         if (func.fromView && func.fromView.function) {
                                saveInfoAboutTransformer("fromView", func, possibleImports, cm);
                         }
                    }
                });
            });
            generationFiles.forEach(genFile => {
                classMets.forEach( cm => {
                    if (genFile.filename.indexOf(cm.name[0].toLowerCase() + cm.name.substring( 1 ) + ".ts") > -1) {
                        genFile.classes.push(cm);
                    }
                });
                makeCorrectImports(genFile, possibleImports);
            });
        });
    }
    return generationFiles.filter(file => {
         return file.filename;
    });
}

export function  CreateFiles(metadata: FileMetadata[]): string [] {
    let viewsFolder = path.resolve(__dirname, "view/");
    configure(viewsFolder, {autoescape: true, trimBlocks : true});

    let res: string [] = [];
    let c = null;
    for ( let i = 0; i < metadata.length; i++ ) {
        let mdata = metadata[i];
        mdata.classes = mdata.classes.filter(item => item.generateView);
        if (mdata.mapperPath) {
            mdata.classes.forEach(cl => {
                cl.viewModelFromMapper = path.relative(mdata.mapperPath, mdata.filename).split("\\").join("/").split(".ts").join("");
                cl.baseModelFromMapper = path.relative(mdata.mapperPath, mdata.basePath).split("\\").join("/").split(".ts").join("");
            });
        }
        c = render("viewTemplateCommon.njk", {metafile: mdata});
        let mapperc = render("mapperTemplate.njk", {metafile: mdata});
        if (c && c.trim()) {
            const getDirName = path.dirname;
            mkdirp.sync(getDirName(mdata.filename));
            fs.writeFileSync(mdata.filename, c, "utf-8");
            res.push(c);

            let needMapper = !mdata.classes.find(cls => !cls.needMapper) ;

            if (needMapper) {
                let pathArray = mdata.filename.split(".ts").join("").split("/");
                let mapperfilename = mdata.mapperPath + "/" + pathArray[pathArray.length - 1] + "Mapper.ts";
                mkdirp.sync(mdata.mapperPath);
                fs.writeFileSync( mapperfilename, mapperc, "utf-8");
                res.push(mapperc);
            }
        }
    }

    return c;
}

function saveInfoAboutTransformer(direction: "toView"| "fromView", func: Transformer, possibleImports: ImportNode[], cm: ClassMetadata) {
    const importFunctionName = func[direction].function;
    const moduleImport = possibleImports.find(possibleImport => possibleImport.clauses.indexOf(importFunctionName) > -1);
    if (moduleImport) {
        let stringFile = "";
        let pathFromFile = moduleImport.absPathNode.join("/");
        try {
            stringFile = fs.readFileSync(path.resolve(pathFromFile + ".ts")).toString();
            pathFromFile = pathFromFile + ".ts";
        } catch (e) {
            stringFile = fs.readFileSync(path.resolve(pathFromFile + "/index.ts")).toString();
            pathFromFile = pathFromFile + "/index.ts";
        }
        const jsonStructure = parseStruct(stringFile, {}, pathFromFile);
        const funcs = jsonStructure.functions;
        const targetFuncs = funcs.find(func => func.name === importFunctionName);
        func[direction].isAsync = targetFuncs.isAsync;
        const asyncDirect = direction === "toView"
            ? "isToViewAsync"
            : "isFromViewAsync";
        if (!cm[asyncDirect]) {
            cm[asyncDirect] = targetFuncs.isAsync;
        }
        func[direction].isPrimitive = false;
        const contextTypeOfTransformer = targetFuncs.params[1] && targetFuncs.params[1].type || null;
        if (contextTypeOfTransformer) {
            if (!cm.contextType[direction]
                || (cm.contextType[direction] && cm.contextType[direction] === contextTypeOfTransformer)
                || contextTypeOfTransformer === "any") {
                cm.contextType[direction] = contextTypeOfTransformer;
                const fldsWithContext =  cm.fields.filter(f => f.fieldConvertFunction && f.fieldConvertFunction[direction]);
                fldsWithContext.forEach(f => {
                    const funcToRecognize =  funcs.find(func => func.name === f.fieldConvertFunction[direction].function);
                    if (funcToRecognize && funcToRecognize.params && funcToRecognize.params[1]) {
                        cm.contextTypeFields[direction].push(f.name);
                    }
                });
            } else {
                throw new Error("Context for one-side mapper shuold be of one type or any");
            }
            const isPrimitiveType = !!primitiveTypes.find(type => type === cm.contextType[direction] );
            if (!isPrimitiveType) {
                const contextTypeImport = jsonStructure._imports.find(imp => !!imp.clauses.find(clause =>  cm.contextType[direction].includes(clause)));
                possibleImports.push({
                    clauses: [cm.contextType[direction]],
                    absPathNode: contextTypeImport.absPathNode,
                    isNodeModule: false
                });
            }
        }
    } else {
        func[direction].isPrimitive = true;
        if ( func[direction].function !== "null" && func[direction].function !== "undefined") {
            func[direction].isPrimitiveString = isNaN(+func[direction].function);
        } else {
            func[direction].isPrimitiveString = false;
        }
    }
}


function FillFileMetadataArray(generationFiles: FileMetadata[], genViewOpt: GenerateViewOptions, file: string) {
    let fileMet : FileMetadata;
    fileMet = new FileMetadata();
    fileMet.basePath = file;
    fileMet.classes = new Array<ClassMetadata>();
    const {filePath, model} = genViewOpt;
    fileMet.filename = `${filePath}/${model[0].toLowerCase()}${model.substring(1)}.ts`;
    fileMet.mapperPath = genViewOpt.mapperPath;
    generationFiles.push( fileMet);
    return fileMet ;
}

function makeCorrectImports(fileMetadata: FileMetadata , imports: ImportNode[]) {
    fileMetadata.classes.forEach(cls => {
        let usingTypesInClass = unique(cls.fields
            .filter(fld => !fld.ignoredInView)
            .map(fld => fld.type));
        let indexesOfCorrectImoprts: number[] = [];
        let importsForMapper: string[] = [];
        cls.fields.forEach(f => {
            if ( f.fieldConvertFunction && !f.ignoredInView) {
                if (f.fieldConvertFunction.toView && !f.fieldConvertFunction.toView.isPrimitive) {
                    let mainClass = f.fieldConvertFunction.toView.function.split(".")[0];
                    usingTypesInClass.push(mainClass);
                    importsForMapper.push(mainClass);
                }
                if (f.fieldConvertFunction.fromView && !f.fieldConvertFunction.fromView.isPrimitive) {
                    let mainClass = f.fieldConvertFunction.fromView.function.split(".")[0];
                    usingTypesInClass.push(mainClass);
                    importsForMapper.push(mainClass);
                }
            }
            if (f.needGeneratedMapper) {
                usingTypesInClass.push(f.type + "Mapper");
                importsForMapper.push(f.type + "Mapper");
            }
        });
        if (cls.contextType.fromView && !primitiveTypes.find(type => cls.contextType.fromView === type)) {
            importsForMapper.push(cls.contextType.fromView);
            imports.forEach((ind, j) => {
                if (ind.clauses.find( clause => clause === cls.contextType.fromView)) {
                    indexesOfCorrectImoprts.push(j);
                }
            });
        }
        if (cls.contextType.toView && !primitiveTypes.find(type => cls.contextType.toView === type)) {
            importsForMapper.push(cls.contextType.toView);
            imports.forEach((ind, j) => {
                if (ind.clauses.find( clause => clause === cls.contextType.toView)) {
                    indexesOfCorrectImoprts.push(j);
                }
            });
        }
        usingTypesInClass.forEach(type => {
            for ( let ind = 0; ind < imports.length; ind++) {
                if ( imports[ind].clauses.indexOf(type) > -1) {
                    indexesOfCorrectImoprts.push(ind);
                }
            }
        });
        const uniqueIndexsOfCorrectImports: Set<number> = new Set(indexesOfCorrectImoprts);
        uniqueIndexsOfCorrectImports.forEach(ind => {
            let imp = new Import();
            imp.type = `{ ${imports[ind].clauses.join(",")} }`;
            let toPath = imports[ind].absPathNode.join("/");
            let fromPath = fileMetadata.filename.split(".ts").join("");
            let _path: string = toPath;
            if (!imports[ind].isNodeModule) {
                _path = path.relative(path.dirname(fromPath), toPath).split("\\").join("/");
                if ( _path.indexOf("./") < 0 ) {
                _path = "./" + _path;
                }
            }
            imp.path = _path;
            importsForMapper.forEach( impForMapper => {
                if (imports[ind].clauses.indexOf(impForMapper) > -1) {
                    fromPath = fileMetadata.mapperPath;
                    let arrayPath = path.relative(fromPath, toPath).split("\\");
                    arrayPath[arrayPath.length - 1] = arrayPath[arrayPath.length - 1].charAt(0).toLowerCase() + arrayPath[arrayPath.length - 1].slice(1);
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
        } else {
            const newImportsSamePathImports = newImports.find(_import => _import.path === imp.path);
            if (newImportsSamePathImports) {
                const targetImportClauses = imp.type.replace("{", "").replace("}", "").trim().split(",");
                const inArrayImportClasues = imp.type.replace("{", "").replace("}", "").trim().split(",");
                const commonArrayOfClauses = Array.from(new Set([...targetImportClauses, ...inArrayImportClasues]));
                newImportsSamePathImports.type = `{ ${commonArrayOfClauses.join(",")}}`;
            } else {
                newImports.push(imp);
            }
        }
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

function getAllfiles(path: string, resultPathes: string[], checkingFolders: string[]) {
    fs.readdirSync(path).forEach(f => {
        let pth =  path + `/${f}`;
        checkingFolders.forEach(_folder => {
            if (fs.statSync(pth).isDirectory()) {
                if ( (_folder.length >= pth.length
                    && _folder.includes(pth)) || (pth.length >= _folder.length && pth.includes(_folder))
                    ) {
                    getAllfiles(pth , resultPathes, checkingFolders);
                }
            } else {
                let tsRegExp = /.+\.ts$/;
                let matches = tsRegExp.exec(pth);
                if ( matches && matches.length > 0 && resultPathes.indexOf(matches[0]) === -1) {
                    resultPathes.push( matches[0]);
                }
            }
        });
    });
  }
