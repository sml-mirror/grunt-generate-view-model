import { TypeKind } from "ts-file-parser";



export enum FuncDirection {
    toView = "toView",
    fromView = "fromView"
}

export const asyncDirection = {
    [FuncDirection.toView]: "isToViewAsync",
    [FuncDirection.fromView]: "isFromViewAsync",
};

export enum ConsoleColor {
    Red = "\x1b[31m",
    Green = "\x1b[32m",
    Cyan = "\x1b[36m",
    Default = "\x1b[0m"
}