import { Decorator } from 'ts-file-parser';
import { Transformer } from './transformer';

export class FieldMetadata {
    public name: string;
    public type: string;
    public nullable: boolean;
    public baseModelName: string;
    public baseModelType: string;
    public decorators: Decorator[]
    public ignoredInView = false;
    public isArray = false;
    public isComplexType = false;
    public isEnum = false;
    public fieldConvertFunction: Transformer = null;
    public toStringWanted = false;
    public needGeneratedMapper = false;
}
