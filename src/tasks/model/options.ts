export class Options {
    public files: FileDescriptor[];
    public isOneFile: boolean;
}
export class FileDescriptor {
    public source: string;
    public destination: string;
    public baseDestination: string;
}