
export class FieldMetadata {
    public name: string;
    public type: string;
    public isNullable: boolean = false;
    public baseModelName: string;
    public baseModelType: string;
    public ignoredInView: boolean = false;
    public isArray: boolean = false;
    public isComplexObj: boolean = false;
    public fieldConvertFunction: string;
    public toStringWanted: boolean = false;
}