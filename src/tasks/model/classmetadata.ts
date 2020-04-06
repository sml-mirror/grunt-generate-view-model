
import {FieldMetadata} from "./fieldmetadata";

export class ClassMetadata {
    public name: string;
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
        toView: string;
        fromView: string;
    } = {
        toView: "",
        fromView: "",
    };
}