import { Transformer } from "./transformer";

export class ViewModelTypeOptions {
    type: string;
    filepath: string;
    modelName?: string;
    isView?: boolean = false;
    transformer?: Transformer;
}