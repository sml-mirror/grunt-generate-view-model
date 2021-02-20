import { Transformer } from './transformer';

export class ViewModelTypeOptions {
    type: any;
    modelName?: string;
    transformer?: Transformer;
    nullable?: boolean;
}
