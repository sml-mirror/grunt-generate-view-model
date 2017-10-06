export interface IMyFilesConfig extends grunt.file.IFilesConfig {
    orig: IOrigDest;
}


interface IOrigDest {
    dest: string;
}