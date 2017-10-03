"use strict";
import {createViewModels} from "../src/tasks/createViewModels";


export function createViewModelsFunction(prop: any) {
    createViewModels(prop);
}

export function GenerateView(modelName: string): any {
    return function(){
        var f;
    };
}

export function IgnoreViewModel(): any {
    return function(){
        var f;
    };
}

export function ViewModelName(name: string): any {
    return function(){
        var f;
    };
}

export function ViewModelType(type: string, filepath: string): any {
    return function(){
        var f;
    };
}



