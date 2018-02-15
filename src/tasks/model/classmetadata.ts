
import {FieldMetadata} from "./fieldmetadata";

export class ClassMetadata {
    public name: string;
    public fields: FieldMetadata[];
    public generateView: boolean = false;
    public needMapper: boolean = false;
    public baseName: string = null;
    public baseNamePath: string = null;
}