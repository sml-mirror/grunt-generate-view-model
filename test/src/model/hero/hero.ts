import {GenerateView, IgnoreViewModel, ViewModelName, ViewModelType, NeedMapper} from "../../../../src/index";
import {HeroDetail} from "./heroDetail";



@GenerateView("HeroViewModel")
@GenerateView("HeroViewModel1")
@NeedMapper()
export class Hero {

    @ViewModelType({"type": "string"
    , "pathNote": {"baseClassPath": ""}})
    @IgnoreViewModel("HeroViewModel1")
    public id?: number;


    public name: string;

    @ViewModelName("information", "HeroViewModel")
    public data: string;

    @IgnoreViewModel()
    public detailId?: number;

    @ViewModelType({"type": "HeroDetail",
    "pathNote": { "baseClassPath": "../../../src/model/hero/heroDetail", "mapperClassPath": "../../../../src/model/hero/heroDetail"},
    "modelName": "HeroViewModel"})
    @IgnoreViewModel("HeroViewModel1")
    public detail: HeroDetail;

    @ViewModelType({"type": "HeroDetailViewModel",
    "pathNote": { "baseClassPath": "./heroDetailViewModel", "mapperClassPath": "../heroDetailViewModel"}, "isView": true})
    @IgnoreViewModel("HeroViewModel1")
    public detailVM: HeroDetail;

    @ViewModelType({"type": "HeroDetailViewModel",
    "pathNote": { "baseClassPath": "./heroDetailViewModel", "mapperClassPath": "../heroDetailViewModel"},
    "modelName": "HeroViewModel", "inputNames": ["details"], "isView": true})
    @ViewModelType({"type": "HeroDetailViewModel",
    "pathNote": { "baseClassPath": "./heroDetailViewModel", "mapperClassPath": "../heroDetailViewModel"}
    , "modelName": "HeroViewModel1"})
    public details: HeroDetail[];

    @ViewModelType({"type": "HeroDetailViewModel",
    "pathNote": { "baseClassPath": "./heroDetailViewModel", "mapperClassPath": "../heroDetailViewModel"}})
    public detailsVM: HeroDetail[];

    public simpleArray: number[];

}