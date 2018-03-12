export class Options {
    public mapperDestination: string;
    public files: FileMapping[];
}
export class FileMapping {
    public viewModelNames?: string[];
    public baseName?: string;
    public source: string;
    public destination: string;
}