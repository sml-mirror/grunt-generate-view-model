
import {ClassMetadata} from "./model/classmetadata";
import {FieldMetadata} from "./model/fieldmetadata";
import {FileMetadata} from "./model/filemetadata";
import {Options, FileMapping} from "./model/options";
import {IExtensionGruntFilesConfig} from "./model/extensionFileConfig";
import {parseStruct} from "ts-file-parser";
import {ArrayType, BasicType} from "ts-file-parser";
import {render, renderString, configure} from "nunjucks";
import * as path from "path";


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

            });
            if (classMet.generateView === false) {
                return;
            }

            //here we have several viewClassTemplates by one class

            classMets.forEach(cm => {
                cls.fields.forEach(fld => {
                    let fldMetadata = new FieldMetadata();
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
                            //fldMetadata.name = dec.arguments[0].toString();
                        }
                        if (dec.name === "ViewModelType") {
                            if (dec.arguments[2] && dec.arguments[2].toString() === cm.name) {
                                fldMetadata.type = dec.arguments[0].toString();
                                let filename = dec.arguments[1].toString();
                                if (filename) {
                                    let insertedImport = "import { " + fldMetadata.type + "} from '" + filename + "';";
                                    if (fileMet.imports.indexOf(insertedImport) === -1) {
                                        fileMet.imports.push(insertedImport);
                                    }
                                }
                            } else if (!dec.arguments[2]) {
                                fldMetadata.type = dec.arguments[0].toString();
                                let filename = dec.arguments[1].toString();
                                if (filename) {
                                    let insertedImport = "import { " + fldMetadata.type + "} from '" + filename + "';";
                                    if (fileMet.imports.indexOf(insertedImport) === -1) {
                                        fileMet.imports.push(insertedImport);
                                    }
                                }
                            }
                        }
                    });
                    cm.fields.push(fldMetadata);
                    //classMet.fields.push(fldMetadata);
                });
            });
            if (fileMet.classes === null) {
                fileMet.classes = [];
            }
            classMets.forEach( cm => {
                fileMet.classes.push(cm);
            });
        });
        fileMet.classes = fileMet.classes.filter(function(cls: ClassMetadata) {
                return file.viewModelNames.indexOf(cls.name) > -1;
        });
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
        if (c && c.trim()) {
            var fs = require("fs");
            var mkdirp = require("mkdirp");
            var getDirName = require("path").dirname;
            mkdirp.sync(getDirName(metadata[i].filename));
            fs.writeFileSync(metadata[i].filename, c, "utf-8");
            res.push(c);
        }
    }

    return c;
}