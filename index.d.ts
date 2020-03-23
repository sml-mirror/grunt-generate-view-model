export declare function GenerateView( options: GenerateViewOptions)

export declare function IgnoreViewModel( modelName?: string ): Function;

export declare function ViewModelName( name: string, modelName?: string ): Function;

export declare function ViewModelType(viewModelTypeOptions: ViewModelTypeOptions): Function;

export declare class GenerateViewOptions {
    model: string;
    filePath: string;
    mapperPath?: string;
}

export declare class ViewModelTypeOptions {
    type: Object;
    modelName?: string;
    transformer?: Transformer;
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