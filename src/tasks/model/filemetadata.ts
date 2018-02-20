import {ClassMetadata} from "./classmetadata";
import {Import} from "./import";
import { PathNote } from "./pathNote";

export class FileMetadata {

    constructor (
        public filename: string = null,
        public baseFilename: string = null,
        public basePath: string = null,
        public classes: ClassMetadata[] = null,
        public mapperPath: string = null,
        public imports: Import[] = []) {
    }

    public addImport( tartgetImportType: string, tartgetImportPath: string|PathNote, isTransform: boolean, isView: boolean): boolean {
        let include: boolean = false;
        let acceptable: boolean = false;
        let _import: Import;
        _import = new Import();
        _import.classType = tartgetImportType;
        if (typeof(tartgetImportPath) === "string") {
        _import.mapperPath = tartgetImportPath;
        } else {
            _import.viewPath = tartgetImportPath.baseClassPath;
            _import.mapperPath = tartgetImportPath.mapperClassPath;
        }
        _import.isTransformer = isTransform;
        _import.isViewClass = isView;
        for (let i = 0; i < this.imports.length; i++) {
            if (this.imports[i].classType === _import.classType && this.imports[i].viewPath === _import.viewPath) {
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
                    if ((imp.classType === fld.type && !fld.ignoredInView) || (imp.classType === fld.fieldConvertFunction)) {
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