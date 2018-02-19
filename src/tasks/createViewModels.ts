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
            fileMet.classes = new Array<ClassMetadata>();
        }
        var stringFile = fs.readFileSync(file.source, "utf-8");
        var jsonStructure = parseStruct(stringFile, {}, file.source);
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

                    if ((<ArrayType>fld.type).base !== undefined) {
                        fldMetadata.isArray = true;
                        fldMetadata.baseModelType = (<BasicType>(<ArrayType>fld.type).base).typeName;
                        var curBase = (<ArrayType>fld.type).base;
                        while ((<ArrayType>curBase).base !== undefined) {
                            curBase = (<ArrayType>curBase).base;
                            fldMetadata.baseModelType = (<BasicType>curBase).typeName;
                        }
                    } else {
                        fldMetadata.baseModelType = (<BasicType>fld.type).typeName;
                        var typeName = (<BasicType>fld.type).typeName;
                        if (typeName !== "string" && typeName !== "number" && typeName !== "boolean" && typeName !== "undefined"
                        && typeName !== "null") {
                            fldMetadata.isComplexObj = true;
                        }
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
                                if (fieldTypeOptions.inputNames) {
                                    fieldTypeOptions.inputNames.forEach(n => {
                                        cm.mapperotherClasses.push(n);
                                    });
                                    fldMetadata.nameOfMapEntity = fieldTypeOptions.inputNames;
                                }
                                fldMetadata.type = fieldTypeOptions.type;
                                let filename = fieldTypeOptions.filepath;
                                if ( fldMetadata.type === "string" && fldMetadata.type !== fldMetadata.baseModelType ) {
                                    fldMetadata.toStringWanted = true;
                                }
                                if (filename) {
                                    fileMet.addImport(fldMetadata.type, filename, false, fieldTypeOptions.isView);
                                }
                                if (fieldTypeOptions.transformer) {
                                    let transformer = fieldTypeOptions.transformer;
                                    let func = transformer.func;
                                    let functionPath = transformer.funcPath;
                                    fileMet.addImport(func, functionPath, true, fieldTypeOptions.isView);
                                    fldMetadata.fieldConvertFunction = func;
                                }
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
        fileMet.filterImport();
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
                var fs1 = require("fs");
                var mkdirp1 = require("mkdirp");
                var getDirName1 = require("path").dirname;
                mkdirp.sync(getDirName(mdata.filename.split(".ts").join("Mapper.ts")));
                fs.writeFileSync(mdata.filename.split(".ts").join("Mapper.ts"), mapperc, "utf-8");
                res.push(mapperc);
            }
        }
    }

    return c;
}
