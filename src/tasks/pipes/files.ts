import * as fs from 'fs';
import { FileMetadata } from '../model/filemetadata';

const mkdirp = require('mkdirp');

export const getAllFiles = (folders: string[] = []) => {
    const tsRegExp = /.+\.ts$/;
    const returnFiles: string[] = [];

    folders.forEach(folderPath => {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
            const endPath = `${folderPath}/${file}`;
            const matches = tsRegExp.exec(endPath);
            const isAnyMatches = matches && matches.length;
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
    const pathArray = fileMetadata.filename.split('.ts').join('').split('/');
    const mapperModelName = pathArray[pathArray.length - 1];
    const mapperFilename = `${fileMetadata.mapperPath}/${mapperModelName}Mapper.ts`;
    mkdirp.sync(fileMetadata.mapperPath);
    fs.writeFileSync( mapperFilename, mapperContent, 'utf-8');
};
