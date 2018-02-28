import {ClassMetadata} from "./classmetadata";
import {Import} from "./import";

export class FileMetadata {

    constructor (
        public filename: string = null,
        public baseFilename: string = null,
        public basePath: string = null,
        public classes: ClassMetadata[] = null,
        public mapperPath: string = null,
        public imports: Import[] = []) {
    }
}
