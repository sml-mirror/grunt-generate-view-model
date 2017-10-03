"use strict";

import {parseStruct} from "ts-file-parser";
import {ArrayType, BasicType} from "ts-file-parser";
import {ClassMetadata} from "./model/classmetadata";
import {FieldMetadata} from "./model/fieldmetadata";
import {FileMetadata} from "./model/filemetadata";
import {render, renderString, configure} from "nunjucks";
import * as path from "path";

function makeView(grunt: any) {
    grunt.registerMultiTask("generateViewModel", "Specify an generateViewModel configuration for future tasks in the chain", function() {
      var  metadata = createMetadatas(this.files, grunt, this);
      CreateFiles(metadata, grunt);
  });
  }

  module.exports = makeView;

  function createMetadatas(files: any, grunt: any, obj: any) {
      var options = obj.options({
          encoding: grunt.file.defaultEncoding,
          processContent: false,
          processContentExclude: [],
          timestamp: false,
          mode: false
        });
      let generationFiles: FileMetadata[];
      generationFiles = new Array<FileMetadata>();
      var wasFiled = 0;
      var fileMet;
      var isOneFile = obj.data.oneFile;
      for (var file of files){
          if (isOneFile) {
              if (fileMet === undefined) {
              fileMet = new FileMetadata();
              }
              fileMet.filename = file.orig.dest + "/common.ts";
              if (fileMet.classes === undefined) {
              fileMet.classes = new Array<ClassMetadata>();
              }
          }
          if (!isOneFile) {
              fileMet = new FileMetadata();
              fileMet.filename = file.dest;
              fileMet.classes = new Array<ClassMetadata>();
          }
          var stringFile = grunt.file.read(file.src, options);
          var jsonStructure = parseStruct(stringFile, {}, file.src);

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

  function  CreateFiles(metadata: FileMetadata[], grunt: any) {
      let viewsFolder = path.resolve(__dirname, "view/");
      configure(viewsFolder, {autoescape: true, trimBlocks : true});
      for ( var i = 0; i < metadata.length; i++ ) {
          var mdata = metadata[i];
          mdata.classes = mdata.classes.filter((item) => item.generateView);
          var c = render("viewTemplateCommon.njk", {metafile: mdata});
          if (c && c.trim()) {
              grunt.file.write(metadata[i].filename, c);
          }
      }
  }
