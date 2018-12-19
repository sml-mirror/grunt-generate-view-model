export class Transformer {
    public toView?: ToViewTransformer;
    public fromView?: FromViewTransformer;
    public contextObject?: boolean;
}

export class ToViewTransformer {
    public function: any;
    public isAsync?: boolean = false;
}

export class FromViewTransformer {
    public function: any;
    public isAsync?: boolean = false;
}