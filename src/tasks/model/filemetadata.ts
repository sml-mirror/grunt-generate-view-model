import {ClassMetadata} from "./classmetadata";

export class FileMetadata {

    constructor (
        public filename: string = null,
        public classes: ClassMetadata[] = null,
        public imports: string[] = []) {
    }
}