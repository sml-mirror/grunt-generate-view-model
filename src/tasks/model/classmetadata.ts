
import { Decorator } from "ts-file-parser";
import {FieldMetadata} from "./fieldmetadata";

export interface ContextInfo {
    value: string;
    mandatory: boolean;
}

export class ClassMetadata {
    public name: string;
    public type: 'interface' | 'class' = 'interface';
    public decorators: Decorator[];
    public fields: FieldMetadata[];
    public generateView: boolean = false;
    public needMapper: boolean = false;
    public isToViewAsync: boolean = false;
    public isFromViewAsync: boolean = false;
    public viewModelFromMapper : string = null;
    public baseName: string = null;
    public baseNamePath: string = null;
    public baseModelFromMapper: string = null;
    contextType: {
        toView: ContextInfo;
        fromView: ContextInfo;
    } = {
        toView: {value: "", mandatory: false},
        fromView: {value: "", mandatory: false},
    };
    contextTypeFields: {
        toView: string[];
        fromView: string[];
    } = {
        toView: [],
        fromView: []
    };
}