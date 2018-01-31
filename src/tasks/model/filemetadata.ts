import {ClassMetadata} from "./classmetadata";
import {Import} from "./import";

export class FileMetadata {

    constructor (
        public filename: string = null,
        public classes: ClassMetadata[] = null,
        public imports: Import[] = []) {
    }

    public addImport( tartgetImportType: string, tartgetImportPath: string): boolean {
        let include: boolean = false;
        let acceptable: boolean = false;
        let _import: Import;
        _import = new Import();
        _import.classType = tartgetImportType;
        _import.path = tartgetImportPath;
        for (let i = 0; i < this.imports.length; i++) {
            if (this.imports[i].classType === _import.classType && this.imports[i].path === _import.path) {
                include = true;
            }
        }
        if (!include) {
            this.imports.push(_import);
            return true;
        }
        return false;
    }
    public filterImport() {
        let tmpImport : Import[] = new Array<Import>();
        this.imports.forEach(imp => {
            let impInclude : boolean = false;
            this.classes.forEach(cls => {
                cls.fields.forEach(fld => {
                    if (imp.classType === fld.type && !fld.ignoredInView) {
                        impInclude = true;
                    }
                });
            });
            if ( impInclude) {
                tmpImport.push(imp);
            }
        });
        this.imports = tmpImport;

    }
}