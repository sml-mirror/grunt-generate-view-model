import {ClassMetadata} from "./classmetadata";
import {Import} from "./import";

export class FileMetadata {

    constructor (
        public filename: string = null,
        public type: 'interface'| 'class' = 'interface',
        public basePath: string = null,
        public classes: ClassMetadata[] = null,
        public mapperPath: string = null,
        public imports: Import[] = []) {
    }
}
