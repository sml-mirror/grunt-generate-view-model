"use strict";
import {createViewModelsInternal} from "../src/tasks/createViewModels";
import {Options} from "./tasks/model/options";


export function createViewModels(options: Options): string [] {
    return createViewModelsInternal(options);
}

export function GenerateView(modelName: string): Function {
    return function(){
        var f;
    };
}

export function IgnoreViewModel(modelName?: string): Function  {
    return function(){
        var f;
    };
}

export function ViewModelName(name: string, modelName?: string): Function  {
    return function(){
        var f;
    };
}

export function ViewModelType(type: string, filepath: string, modelName?: string): Function  {
    return function(){
        var f;
    };
}



