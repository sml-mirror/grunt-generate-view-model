export class Import {
    public type: string;
    public path: string;
    public forMapper?: boolean = false;
    public dependencyMappers: string[] = [];
}