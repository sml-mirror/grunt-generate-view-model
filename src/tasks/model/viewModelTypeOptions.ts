import { Transformer } from "./transformer";
import { Type } from "typescript";

export class ViewModelTypeOptions {
    type: string;
    modelName?: string;
    transformer?: Transformer;
}