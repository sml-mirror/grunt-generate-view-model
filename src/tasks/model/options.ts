export class Options {
    public files: FileMapping[];
    public allInOneFile: string;
}
export class FileMapping {
    public viewModelNames?: string[];
    public baseName?: string;
    public source: string;
    public destination: string;
}