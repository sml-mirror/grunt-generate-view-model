import { Import } from "./model/import";
import {ClassMetadata} from "./model/classmetadata";
import {FieldMetadata} from "./model/fieldmetadata";
import {FileMetadata} from "./model/filemetadata";
import {Options, FileMapping} from "./model/options";
import {IExtensionGruntFilesConfig} from "./model/extensionFileConfig";
import {parseStruct} from "ts-file-parser";
import {ArrayType, BasicType} from "ts-file-parser";
import {render, renderString, configure} from "nunjucks";
import * as path from "path";
import { Transformer } from "./model/transformer";
import {ViewModelTypeOptions} from "./model/viewModelTypeOptions";


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
        var jsonStructure = parseStruct(stringFile, {}, file.source);
        //console.log(jsonStructure);

        jsonStructure.classes.forEach(cls => {
            let classMet = new ClassMetadata();
            let classMets = new Array<ClassMetadata>();

            classMet.name = cls.name;
            classMet.fields = new Array<FieldMetadata>();
            let classMetsFields = new Array<Array<FieldMetadata>>();

            cls.decorators.forEach(dec => {
                if (dec.name === "GenerateView") {
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
                                fldMetadata.type = fieldTypeOptions.type;
                                if ( fldMetadata.type === "string" && fldMetadata.type !== fldMetadata.baseModelType ) {
                                    fldMetadata.toStringWanted = true;
                                }
                            }
                            if (fieldTypeOptions.transformer) {
                                let transformer = fieldTypeOptions.transformer;
                                let isBreak = false;
                                jsonStructure._imports.forEach(imp => {
                                    if (isBreak === false) {
                                        imp.clauses.forEach(clause => {
                                            if (clause === path.parse(transformer.function).name) {
                                                let _import = new Import();
                                                let clauses = clause;
                                                let toPath = imp.absPathNode.join("/");
                                                let fromPath = fileMet.mapperPath.split(".ts").join("");
                                                let _path: string = toPath;
                                                if (!imp.isNodeModule) {
                                                    _path = path.relative(path.dirname(fromPath), toPath).split("\\").join("/");
                                                    if ( _path.indexOf("./") < 0 ) {
                                                    _path = "./" + _path;
                                                    }
                                                }
                                                fldMetadata.fieldConvertFunction = transformer;
                                                _import.type = clauses;
                                                _import.path = _path;
                                                _import.isTransformer = true;
                                                fileMet.imports.push(JSON.parse(JSON.stringify(_import)));
                                                isBreak = true;
                                                return;
                                            }
                                        });
                                    }
                                });
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

        jsonStructure._imports = jsonStructure._imports.filter(i => {
                if (i.clauses.indexOf("GenerateView")) {
                    return true;
                }
                return false;
        });
        jsonStructure._imports.forEach(imp => {
            let _import = new Import();
            let clauses = imp.clauses.join(",");
            let toPath = imp.absPathNode.join("/");
            let fromPath = file.destination.split(".ts").join("");
            let _path: string = toPath;
            if (!imp.isNodeModule) {
                _path = path.relative(path.dirname(fromPath), toPath).split("\\").join("/");
                if ( _path.indexOf("./") < 0 ) {
                    _path = "./" + _path;
                }
            }
            _import.type = clauses;
            _import.path = _path;
            fileMet.imports.push(JSON.parse(JSON.stringify(_import)));
        });
        let filterImports = [];
        let i = 0;


        fileMet.imports = fileMet.imports.filter(item => {
            let isFilter: boolean = false;
            fileMet.imports.forEach(innerItem => {
                if (item.type === innerItem.type && innerItem.isTransformer !== item.isTransformer) {
                    if ( item.isTransformer === true) {
                        let index = fileMet.imports.lastIndexOf(innerItem);
                        fileMet.imports[index] = new Import();
                        fileMet.imports[index].type = "toDelete";
                        isFilter = false;
                    } else {
                        item.isTransformer = true;
                        isFilter = true;
                    }
                } else if (item.type === innerItem.type && innerItem.isTransformer === item.isTransformer) {
                    isFilter = true;
                }
                return;
            });
            return isFilter;
        });
        fileMet.imports = fileMet.imports.filter(imp => {
            if (imp.type === "toDelete") {
                return false;
            } else {
                return true;
            }
        } );
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
