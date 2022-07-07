
import { Decorator } from 'ts-file-parser';
import { FieldMetadata } from './fieldmetadata';

export interface ContextInfo {
    value: string;
    mandatory: boolean;
}

interface ContextType {
    toView: ContextInfo;
    fromView: ContextInfo;
}

interface ContextTypeFields {
    toView: string[];
    fromView: string[];
}
export class ClassMetadata {
    public name: string;
    public type: 'interface' | 'class' = 'interface';
    public decorators: Decorator[];
    public fields: FieldMetadata[];
    public generateView = false;
    public needMapper = false;
    public isToViewAsync = false;
    public isFromViewAsync = false;
    public viewModelFromMapper : string = null;
    public baseName: string = null;
    public baseNamePath: string = null;
    public baseModelFromMapper: string = null;
    contextType: ContextType = {
        toView: { value: '', mandatory: false },
        fromView: { value: '', mandatory: false },
    };
    contextTypeFields: ContextTypeFields = {
        toView: [],
        fromView: []
    };
}
