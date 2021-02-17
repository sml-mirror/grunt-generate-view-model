"use strict";
import {createViewModelsInternal} from "../src/tasks/createViewModels";
import {Options} from "./tasks/model/options";
import { Transformer } from "./tasks/model/transformer";
import { ViewModelTypeOptions } from "./tasks/model/viewModelTypeOptions";
import { GenerateViewOptions } from "./tasks/model/generateViewOptions";


export function createViewModels() {
    return createViewModelsInternal();
}

export function GenerateView( options: GenerateViewOptions): Function {
    return function() {
        var f;
    };
}

export function IgnoreViewModel(modelName?: string): Function  {
    return function() {
        var f;
    };
}

export function ViewModelName(name: string, modelName?: string): Function  {
    return function() {
        var f;
    };
}

export function ViewModelType(viewModelTypeOptions: ViewModelTypeOptions): Function  {
    return function() {
        var f;
    };
}


