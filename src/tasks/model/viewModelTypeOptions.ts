import { Transformer } from "./transformer";
import { Type } from "typescript";

export class ViewModelTypeOptions {
    type: Object;
    modelName?: string;
    transformer?: Transformer;
    nullable?: boolean;
}