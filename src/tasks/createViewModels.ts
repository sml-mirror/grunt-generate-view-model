import { Import } from "./model/import";
import {ClassMetadata} from "./model/classmetadata";
import {FieldMetadata} from "./model/fieldmetadata";
import {FileMetadata} from "./model/filemetadata";
import {Options, FileMapping} from "./model/options";
import {IExtensionGruntFilesConfig} from "./model/extensionFileConfig";
import {parseStruct, ImportNode} from "ts-file-parser";
import {ArrayType, BasicType} from "ts-file-parser";
import {render, renderString, configure} from "nunjucks";
import * as path from "path";
import { Transformer } from "./model/transformer";
import { ViewModelTypeOptions } from "./model/viewModelTypeOptions";
import { GenerateViewOptions } from "./model/generateViewOptions";


export function createViewModelsInternal(prop: Options): string [] {
    var  metadata = createMetadatas(prop);
    var resultTemplate = CreateFiles(metadata);
    return resultTemplate;
}


export function createOptionsOfGrunt(obj: IGrunt): Options {
    var options = new Options();
    var files = new Array<FileMapping>();
    for (var i = 0; i < obj.task.current.files.length; i++) {
        var file = new FileMapping();
        if (obj.task.current.files[i].src.length === 1) {
            file.source = obj.task.current.files[i].src[0];
        } else {
            file.source = obj.task.current.files[i].src[0];
        }
        file.destination = obj.task.current.files[i].dest;
        files.push(file);
    }

    options.files = files;
    if (obj.task.current.data.oneFile && obj.task.current.files.length) {
        var fileConfig = obj.task.current.files[0] as IExtensionGruntFilesConfig;
        options.allInOneFile = `${fileConfig.orig.dest}/common.ts`;
    }
    return options;
}

export function createMetadatas(properties: Options): FileMetadata[] {
    var fs = require("fs");
    let generationFiles: FileMetadata[];
    generationFiles = new Array<FileMetadata>();
    var wasFiled = 0;
    let fileMet : FileMetadata;
    var files = properties.files;
    for (var file of files) {
        if (properties.allInOneFile) {
            if (!fileMet) {
                fileMet = new FileMetadata();
            }

            fileMet.filename = properties.allInOneFile;
            if (fileMet.classes === undefined) {
                fileMet.classes = new Array<ClassMetadata>();
            }
        } else {
            fileMet = new FileMetadata();
            fileMet.filename = file.destination;
            fileMet.mapperPath = properties.mapperDestination;
            fileMet.basePath = file.source;
            fileMet.classes = new Array<ClassMetadata>();
        }
        var stringFile = fs.readFileSync(file.source, "utf-8");
        let correctStringFile  = ViewModelTypeCorrecting(stringFile);
        let tmpFileSource = file.source.split(".ts").join("tmp.ts");
        fs.writeFileSync(tmpFileSource, correctStringFile, "utf-8");
        var jsonStructure = parseStruct(correctStringFile, {}, tmpFileSource);
        fs.unlinkSync(tmpFileSource);
        let possibleImports = jsonStructure._imports;
        jsonStructure.classes.forEach(cls => {
            let classMet = new ClassMetadata();
            let classMets = new Array<ClassMetadata>();

            classMet.name = cls.name;
            classMet.fields = new Array<FieldMetadata>();
            let classMetsFields = new Array<Array<FieldMetadata>>();

            cls.decorators.forEach(dec => {
                if (dec.name === "GenerateView") {
                        let genViewOpt = <GenerateViewOptions>dec.arguments[0].valueOf();
                    if (classMet.generateView === false) {
                        classMet.generateView = true;
                        classMet.name = dec.arguments[0].toString();
                        classMets.push(classMet);
                    } else {
                        let otherClassMet = new ClassMetadata();
                        otherClassMet.generateView = true;
                        otherClassMet.name = dec.arguments[0].toString();
                        otherClassMet.fields = new Array<FieldMetadata>();
                        classMets.push(otherClassMet);
                    }
                }
                if (dec.name === "NeedMapper") {
                    classMets.forEach(clMet => {
                        clMet.needMapper = true;
                    });
                }

            });
            if (classMet.generateView === false) {
                return;
            }
            classMets.forEach(cm => {
                cm.baseName = cls.name;
                cm.baseNamePath =  file.source;
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
                                if ( fldMetadata.type.toLowerCase() === "string" && fldMetadata.type !== fldMetadata.baseModelType ) {
                                    fldMetadata.type = "string";
                                    fldMetadata.toStringWanted = true;
                                }
                            }
                            if (fieldTypeOptions.transformer) {
                                fldMetadata.fieldConvertFunction = fieldTypeOptions.transformer;
                                let isBreak = false;

                            }
                        }
                    });
                    cm.fields.push(fldMetadata);
                });
            });
            if (fileMet.classes === null) {
                fileMet.classes = [];
            }
            classMets.forEach( cm => {
                if (file.viewModelNames.indexOf(cm.name) > -1) {
                    fileMet.classes.push(cm);
                }
            });
        });
        makeCorrectImports(fileMet, possibleImports);
        if (properties.allInOneFile && wasFiled === 0) {
            generationFiles.push(fileMet);
            wasFiled++;
        }
        if (!properties.allInOneFile) {
            generationFiles.push(fileMet);
        }
    }

    return generationFiles;
}

export function  CreateFiles(metadata: FileMetadata[]): string [] {
    let viewsFolder = path.resolve(__dirname, "view/");
    configure(viewsFolder, {autoescape: true, trimBlocks : true});

    let res: string [] = [];
    for ( var i = 0; i < metadata.length; i++ ) {
        var mdata = metadata[i];
        mdata.classes = mdata.classes.filter((item) => item.generateView);
        mdata.classes.forEach(cl => {
            cl.viewModelFromMapper = require("path").relative(mdata.mapperPath, mdata.filename).split("\\").join("/").split(".ts").join("");
        });
        var c = render("viewTemplateCommon.njk", {metafile: mdata});
        var mapperc = render("mapperTemplate.njk", {metafile: mdata});
        if (c && c.trim()) {
            var fs = require("fs");
            var mkdirp = require("mkdirp");
            var getDirName = require("path").dirname;
            mkdirp.sync(getDirName(mdata.filename));
            fs.writeFileSync(mdata.filename, c, "utf-8");
            res.push(c);

            let needMapper = true;
            mdata.classes.forEach(cls => {
                if (cls.needMapper === false) {
                    needMapper = false;
                }
            });
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

function ViewModelTypeCorrecting(input: string): string {
    let firstViewModelTypeInArray = input.split("@ViewModelType");
    let result = firstViewModelTypeInArray.map( str => {
        let tmpStr =  str.trim();
        let viewModelTypeDecoratorRegExp = /\(\s?{\s*?["']type["']\s?:\s?\w+/;
        let matches = viewModelTypeDecoratorRegExp.exec(tmpStr);
        if (matches) {
            let need = matches[0];
            let matchRegExp = /[A-Z]\w+/;
            let innerMatches = matchRegExp.exec(need);
            tmpStr = tmpStr.replace(innerMatches[0], `"${innerMatches[0]}"`);
        }
        let viewModelTypeDecoratorForTransformer = /["']function["']\s?:\s?\w+(\.)?(\w+)?/;
        let secMatches = viewModelTypeDecoratorForTransformer.exec(tmpStr);
        if (secMatches) {
            let need = secMatches[0];
            let matchRegExp = /:\s?\w+(\.)?(\w+)?/;
            let innerMatches = matchRegExp.exec(need);
            let variant = `: "${innerMatches[0].substring(1).trim()}"`;
            tmpStr =  tmpStr.replace(innerMatches[0], variant);
        }
        return tmpStr;
    }).join("@ViewModelType");
    return result;
}

function makeCorrectImports(fileMetadata: FileMetadata , imports: ImportNode[]) {
    fileMetadata.classes.forEach(cls => {
        let usingTypesInClass = cls.fields.filter(fld => {
            if (fld.ignoredInView) {
                return false;
            }
            return true;
        }).map(fld => {
            return fld.type;
        });
        let indexesOfCorrectImoprts = [];
        let imoprtsForMapper = [];
        usingTypesInClass = unique(usingTypesInClass);
        cls.fields.forEach(f => {
            if ( f.fieldConvertFunction && !f.ignoredInView) {
                usingTypesInClass.push(f.fieldConvertFunction.function.split(".")[0]);
                imoprtsForMapper .push(f.fieldConvertFunction.function.split(".")[0]);
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
            imp.type = "{ " + imports[ind].clauses.join(",") + " }";
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
                    fromPath = fileMetadata.mapperPath.split(".ts").join("");
                    imp.path = path.relative(fromPath, toPath).split("\\").join("/");
                    imp.forMapper = true;
                }
            });
            fileMetadata.imports.push(imp);
        });
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