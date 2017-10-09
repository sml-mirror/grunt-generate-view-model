export interface IExtensionGruntFilesConfig extends grunt.file.IFilesConfig {
    orig: IOrigDest;
}

interface IOrigDest {
    dest: string;
}
