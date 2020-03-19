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

const mkdirp = require("mkdirp");
const arrayType = "[]";
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
    let generationFiles: FileMetadata[];
    generationFiles = new Array<FileMetadata>();
    for (let file of files) {
        var stringFile = fs.readFileSync(file, "utf-8");
        var jsonStructure = parseStruct(stringFile, {}, file);
        let possibleImports = jsonStructure._imports;

        jsonStructure.classes.forEach(cls => {
            let classMet = new ClassMetadata();
            let classMets = new Array<ClassMetadata>();

            classMet.name = cls.name;
            classMet.fields = new Array<FieldMetadata>();

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

                        FillFileMetadataArray(generationFiles, genViewOpt, file);
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

                        FillFileMetadataArray(generationFiles, genViewOpt, file);
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
                    fldMetadata.isNullable = fld.optional;
                    fldMetadata.baseModelName = fld.name;
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
                    if (typeName !== "string" && typeName !== "number" && typeName !== "boolean" && typeName !== "undefined"
                    && typeName !== "null") {
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
                            determineAsyncTransformerOrNot('toView', func, possibleImports, cm);
                         }
                         if (func.fromView && func.fromView.function) {
                            determineAsyncTransformerOrNot('fromView', func, possibleImports, cm);
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

function determineAsyncTransformerOrNot(direction: 'toView'| 'fromView', func: Transformer, possibleImports: ImportNode[], cm: ClassMetadata) {
    const importFunctionName = func[direction].function;
    const im1 = possibleImports.find(import1 => import1.clauses.indexOf(importFunctionName) > -1);
    const pathFromFile = im1.absPathNode.join('/');
    const stringFile = fs.readFileSync(path.resolve(pathFromFile + '.ts')).toString();
    const array = stringFile.split('export');
    array.forEach(element => {
        const words = element.split(' ');
        words.forEach((word, index, self) => {
            if (word === func[direction].function) {
                const asyncWord = self.find(item => item === 'async' || item.includes('async(') || item.includes('async ('));
                if (asyncWord) {
                    func[direction].isAsync = true;
                    cm[ direction === 'toView' ? 'isToViewAsync' : 'isFromViewAsync'] = true;
                }
            }
        })
    })
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
}

function makeCorrectImports(fileMetadata: FileMetadata , imports: ImportNode[]) {
    fileMetadata.classes.forEach(cls => {
        let usingTypesInClass = unique(cls.fields
            .filter(fld => !fld.ignoredInView)
            .map(fld => fld.type));
        let indexesOfCorrectImoprts = [];
        let imoprtsForMapper = [];
        cls.fields.forEach(f => {
            if ( f.fieldConvertFunction && !f.ignoredInView) {
                if (f.fieldConvertFunction.toView) {
                    let mainClass = f.fieldConvertFunction.toView.function.split(".")[0];
                    usingTypesInClass.push(mainClass);
                    imoprtsForMapper.push(mainClass);
                }
                if (f.fieldConvertFunction.fromView) {
                    let mainClass = f.fieldConvertFunction.fromView.function.split(".")[0];
                    usingTypesInClass.push(mainClass);
                    imoprtsForMapper.push(mainClass);
                }
            }
            if (f.needGeneratedMapper) {
                usingTypesInClass.push(f.type + "Mapper");
                imoprtsForMapper .push(f.type + "Mapper");
            }
        });
        usingTypesInClass.forEach(type => {
            for ( let ind = 0; ind < imports.length; ind++) {
                if ( imports[ind].clauses.indexOf(type) > -1) {
                    indexesOfCorrectImoprts.push(ind);
                }
            }
        });
        indexesOfCorrectImoprts.forEach(ind => {
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
            imoprtsForMapper.forEach( impForMapper => {
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
    fileMetadata.imports = JSON.parse(JSON.stringify(tmpImports));
    FilterImportingMappers(fileMetadata);
}
function FilterImportingMappers(meta: FileMetadata) {
    meta.imports.forEach( imp => {
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
