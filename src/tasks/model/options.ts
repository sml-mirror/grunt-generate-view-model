
export interface FileMapping {
    viewModelNames?: string[];
    baseName?: string;
    source: string;
    destination: string;
}

export class Options {
    public mapperDestination: string;
    public files: FileMapping[];
}
