export class Transformer {
    public toView?: ToViewTransformer;
    public fromView?: FromViewTransformer;
}

export class ToViewTransformer {
    public function: any;
    public isAsync?: boolean = false;
    public isPrimitive?: boolean = false;
    public isPrimitiveString?: boolean = false;
}

export class FromViewTransformer {
    public function: any;
    public isAsync?: boolean = false;
    public isPrimitive?: boolean = false;
    public isPrimitiveString?: boolean = false;
}