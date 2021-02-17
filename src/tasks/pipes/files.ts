import * as fs from "fs";
import { FileMetadata } from "../model/filemetadata";

const mkdirp = require("mkdirp");

export const getAllFiles = (checkingFolders: string[] = []) => {
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
};


export const createMapperFile = (fileMetadata: FileMetadata, mapperContent: string) => {
    let pathArray = fileMetadata.filename.split(".ts").join("").split("/");
    const mapperModelName = pathArray[pathArray.length - 1];
    const mapperFilename = `${fileMetadata.mapperPath}/${mapperModelName}Mapper.ts`;
    mkdirp.sync(fileMetadata.mapperPath);
    fs.writeFileSync( mapperFilename, mapperContent, "utf-8");
};