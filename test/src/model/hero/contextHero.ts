import {GenerateView, IgnoreViewModel, ViewModelName, ViewModelType} from "../../../../src/index";
import {HeroDetail} from "./heroDetail";
import { notAsyncTransformer, asyncTransformer } from "../../../../transformer/asyncTransformer";

@GenerateView({
    model: "ContextHeroModel",
    filePath: "./test/dist/_autogenerated_viewmodels/heroes",
    mapperPath: "./test/dist/_autogenerated_viewmodels/heroes/mappers"})
export class Hero {
    @IgnoreViewModel("ContextHeroModel")
    public id?: number;


    public name: string;

    @ViewModelType({
    modelName: "ContextHeroModel",
    nullable: false,
    transformer: { toView: { function: asyncTransformer},
                    fromView: { function: null }
                },
    type: HeroDetail})
    public detail: HeroDetail;
}
