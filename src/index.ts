import {createViewModelsInternal} from "../src/tasks/createViewModels";
import { ViewModelTypeOptions } from "./tasks/model/viewModelTypeOptions";
import { GenerateViewOptions } from "./tasks/model/generateViewOptions";

export const createViewModels = createViewModelsInternal;

export function GenerateView( options: GenerateViewOptions): Function {
    return function() {
        var f;
        return f;
    };
}

export function IgnoreViewModel(modelName?: string): Function  {
    return function() {
        var f;
        return f;
    };
}

export function ViewModelName(name: string, modelName?: string): Function  {
    return function() {
        var f;
        return f;
    };
}

export function ViewModelType(viewModelTypeOptions: ViewModelTypeOptions): Function  {
    return function() {
        var f;
        return f;
    };
}


