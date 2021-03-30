import {createViewModelsInternal} from "./tasks/createViewModels";
import { ViewModelTypeOptions } from "./tasks/model/viewModelTypeOptions";
import { GenerateViewOptions } from "./tasks/model/generateViewOptions";

export const createViewModels = createViewModelsInternal;

export function IgnoreDecorators(decoratorsList?: string[], viewModelNames?: string[]):Function {
    return function() {
        const f: any = null;
        return f;
    };
}

export function GenerateView( options: GenerateViewOptions): Function {
    return function() {
        const f: any = null;
        return f;
    };
}

export function IgnoreViewModel(modelName?: string): Function  {
    return function() {
        const f: any = null;
        return f;
    }
}

export function ViewModelName(name: string, modelName?: string): Function  {
    return function() {
        const f: any = null;
        return f;
    };
}

export function ViewModelType(viewModelTypeOptions: ViewModelTypeOptions): Function  {
    return function() {
        const f: any = null;
        return f;
    };
}


