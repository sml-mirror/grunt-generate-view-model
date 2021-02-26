export declare function GenerateView( options: GenerateViewOptions)

export declare function IgnoreViewModel( modelName?: string ): Function;

export declare function ViewModelName( name: string, modelName?: string ): Function;

export declare function ViewModelType(viewModelTypeOptions: ViewModelTypeOptions): Function;

export interface FieldDescription {

}
export interface ClassFieldDescription {
    [field: string]: FieldDescription;
}
export declare class GenerateViewOptions {
    model: string;
    filePath: string;
    mapperPath?: string;
    type?: 'class' | 'interface'
    decorators: {
        ignoreDecorators?: string[];
    }
}

export declare class ViewModelTypeOptions {
    type: Object;
    modelName?: string;
    transformer?: Transformer;
    nullable?: boolean;
}

export declare class Transformer {
    public toView?: ToViewTransformer;
    public fromView?: FromViewTransformer;
}

export declare class ToViewTransformer {
    public function: any;
    public isAsync?: boolean;
    public isPrimitive?: boolean;
    public isPrimitiveString?: boolean;
}

export declare class FromViewTransformer {
    public function: any;
    public isAsync?: boolean;
    public isPrimitive?: boolean;
    public isPrimitiveString?: boolean;
}