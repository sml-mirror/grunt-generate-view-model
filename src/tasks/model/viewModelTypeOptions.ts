import { Transformer } from "./transformer";
import { PathNote } from "./pathNote";

export class ViewModelTypeOptions {
    type: string;
    pathNote?: PathNote;
    modelName?: string;
    isView?: boolean = false;
    transformer?: Transformer;
    inputNames?: string[];
}