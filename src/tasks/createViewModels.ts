
import {ClassMetadata} from "./model/classmetadata";
import {FieldMetadata} from "./model/fieldmetadata";
import {FileMetadata} from "./model/filemetadata";
import {Options, FileDescriptor} from "./model/options";
import {parseStruct} from "ts-file-parser";
import {ArrayType, BasicType} from "ts-file-parser";
import {render, renderString, configure} from "nunjucks";
import * as path from "path";


export function createViewModels(prop: any) {
   var  metadata = createMetadatas(prop);
   var resultTemplate = CreateFiles(metadata);
   return resultTemplate;
}


export function createOptionsOfGrunt(obj: any): any {
    var options = new Options();
    var files = new Array<FileDescriptor>();
    for (var i = 0; i < obj.files.length; i++) {
        var file = new FileDescriptor();
        file.source = obj.files[i].src;
        file.destination = obj.files[i].dest;
        file.baseDestination = obj.files[i].orig.dest;
        files.push(file);
    }
    options.files = obj.files;
    options.isOneFile = obj.data.oneFile;
    return options;
}

export function createMetadatas(properties: Options) {
      var fs = require("fs");
      let generationFiles: FileMetadata[];
      generationFiles = new Array<FileMetadata>();
      var wasFiled = 0;
      var fileMet;
      var isOneFile = properties.isOneFile;
      var files = properties.files;
      for (var file of files){
          if (isOneFile) {
              if (fileMet === undefined) {
              fileMet = new FileMetadata();
              }
              fileMet.filename = file.baseDestination + "/common.ts";
              if (fileMet.classes === undefined) {
              fileMet.classes = new Array<ClassMetadata>();
              }
          }
          if (!isOneFile) {
              fileMet = new FileMetadata();
              fileMet.filename = file.destination;
              fileMet.classes = new Array<ClassMetadata>();
          }
          var stringFile = fs.readFileSync(file.source, "utf-8");
          var jsonStructure = parseStruct(stringFile, {}, file.source);
          jsonStructure.classes.forEach(cls => {
              let classMet = new ClassMetadata();
              classMet.name = cls.name;
              classMet.fields = new Array<FieldMetadata>();
              cls.decorators.forEach(dec => {
                  if (dec.name === "GenerateView") {
                      classMet.generateView = true;
                      classMet.name = dec.arguments[0].toString();
                  }
              });
              if (classMet.generateView === false) {
                  return;
              }
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
                  }else {
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
                          fldMetadata.ignoredInView = true;
                      }
                      if (dec.name === "ViewModelName") {
                          fldMetadata.name = dec.arguments[0].toString();
                      }
                      if (dec.name === "ViewModelType") {
                          fldMetadata.type = dec.arguments[0].toString();
                          let filename = dec.arguments[1].toString();
                          let insertedImport = "import { " + fldMetadata.type + "} from \"" + filename + "\";";
                          if (fileMet.imports.indexOf(insertedImport) === -1) {
                              fileMet.imports.push(insertedImport);
                          }
                      }
                  });
                  classMet.fields.push(fldMetadata);
              });
              if (fileMet.classes === null) {
                fileMet.classes = [];
              }
              fileMet.classes.push(classMet);
          });
          if (isOneFile && wasFiled === 0) {
              generationFiles.push(fileMet);
              wasFiled++;
          }
          if (!isOneFile) {
              generationFiles.push(fileMet);
          }
      }
      return generationFiles;
  }

 export function  CreateFiles(metadata: FileMetadata[]) {
      let viewsFolder = path.resolve(__dirname, "view/");
      configure(viewsFolder, {autoescape: true, trimBlocks : true});
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
          }
      }
      return c;
  }