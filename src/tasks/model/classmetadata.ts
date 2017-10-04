
import {FieldMetadata} from "./fieldmetadata";

export class ClassMetadata {
    public name: string;
    public fields: FieldMetadata[];
    public generateView: boolean = false;
}