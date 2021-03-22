import * as path from "path";

export * from './classmeta';
export * from './decorators';
export * from './enums';
export * from './files';
export * from './transformer';
export * from './import';

export const upFirstLetter = ( str: string = "") => {
    return str[0].toUpperCase() + str.substring(1);
};

export const downFirstLetter = (str: string = "") => {
    return str[0].toLowerCase() + str.substring(1);
};

export const getModelNameFromPath = (from: string, to: string) => {
    return path.relative(from, to).split("\\").join("/").split(".ts").join("");
};

export const unique = (arr: string[]): string[] => {
    let obj = {};

    for (let i = 0; i < arr.length; i++) {
      let str = arr[i];
      obj[str] = true;
    }
    return Object.keys(obj);
};
