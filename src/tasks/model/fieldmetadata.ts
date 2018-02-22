import { Transformer } from "./transformer";

export class FieldMetadata {
    public name: string;
    public type: string;
    public isNullable: boolean = false;
    public baseModelName: string;
    public baseModelType: string;
    public ignoredInView: boolean = false;
    public isArray: boolean = false;
    public isComplexType: boolean = false;
    public fieldConvertFunction: Transformer = null;
    public toStringWanted: boolean = false;
}