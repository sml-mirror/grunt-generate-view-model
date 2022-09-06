import {GenerateView, IgnoreDecorators, IgnoreViewModel, ViewModelName, ViewModelType} from "../../../../src/index";
import {HeroDetail} from "./heroDetail";
import {HeroDetailViewModel} from "../../expected/heroes/heroDetailViewModel";
import { States } from "../../../../src/tasks/model/stateModel";
import { asyncTransformer, notAsyncTransformer, asyncTransformer2, asyncTransformer3 } from "../../../../transformer/asyncTransformer";
import { Length } from "class-validator";
import {NotExistiningDecoratorForClass, ValidatorWithoutBraces} from 'node-modules-library';

@GenerateView({
    model: "HeroViewModel",
    type: 'class',
    filePath: "./test/dist/_autogenerated_viewmodels/heroes",
    mapperPath: "./test/dist/_autogenerated_viewmodels/heroes/mappers"})
@GenerateView({
    model: "HeroViewModel1",
    type: 'class',
    filePath: "./test/dist/_autogenerated_viewmodels/heroes",
    mapperPath: "./test/dist/_autogenerated_viewmodels/heroes/mappers"})
@NotExistiningDecoratorForClass()
@NotExistiningDecoratorForClas2()
@ValidatorWithoutBraces
@IgnoreDecorators(['NotExistiningDecoratorForClass'], ['HeroViewModel1'])
@IgnoreDecorators(['NotExistiningDecoratorForClas2'], ['HeroViewModel'])
export class Hero {
    @ViewModelType({type: "string"})
    @IgnoreViewModel("HeroViewModel1")
    @Length(0,20)
    @ValidatorWithoutBraces
    @IgnoreDecorators(['Length'])
    @ApiProperty({required: true})
    @ApiProperty({required: true}, {fu: 12})
    @ApiProperty({required: true}, {fu: 12}, '12')
    public id?: number;

    @Length(10,20)
    @IgnoreDecorators()
    public name: string;

    @ViewModelName("information", "HeroViewModel")
    public data: string;

    @IgnoreViewModel()
    public detailId?: number;

    @ViewModelType({
    modelName: "HeroViewModel",
    transformer: {
        toView : { function: asyncTransformer },
        fromView: { function: notAsyncTransformer }},
    type: HeroDetail})
    public detail: HeroDetail;

    @ViewModelType({type: "HeroDetailViewModel"})
    @IgnoreViewModel("HeroViewModel1")
    public detailVM: HeroDetail;

    @ViewModelType({
    type: "HeroDetailViewModel[]",
    modelName: "HeroViewModel"})
    @ViewModelType({
    type: "HeroDetailViewModel[]",
    modelName: "HeroViewModel1"})
    public details: HeroDetail[];

    @ViewModelType({type: "HeroDetailViewModel[]"})
    public detailsVM: HeroDetail[];

    @ViewModelType({
        modelName: "HeroViewModel",
        transformer: {
            toView : { function: asyncTransformer3 }},
        type: "number[]"})
    public simpleArray: number[];

    public state: States;

}