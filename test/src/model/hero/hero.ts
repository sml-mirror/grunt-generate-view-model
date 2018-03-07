import {GenerateView, IgnoreViewModel, ViewModelName, ViewModelType, NeedMapper} from "../../../../src/index";
import {HeroDetail} from "./heroDetail";
import {HeroDetailViewModel} from "../../../dist/_autogenerated_viewmodels/heroes/heroDetailViewModel";
import {Class} from "../Path/path";

@GenerateView("HeroViewModel")
@GenerateView("HeroViewModel1")
@NeedMapper()
export class Hero {
    @ViewModelType({"type": "string"})
    @IgnoreViewModel("HeroViewModel1")
    public id?: number;


    public name: string;

    @ViewModelName("information", "HeroViewModel")
    public data: string;

    @IgnoreViewModel()
    public detailId?: number;

    @ViewModelType({
    "type": HeroDetail,
    "transformer": { "function" : Class.func, "isAsync": true},
    "modelName": "HeroViewModel"})
    @IgnoreViewModel("HeroViewModel1")
    public detail: HeroDetail;

    @ViewModelType({"type": HeroDetailViewModel})
    @IgnoreViewModel("HeroViewModel1")
    public detailVM: HeroDetail;

    @ViewModelType({
        "type": HeroDetailViewModel,
    "modelName": "HeroViewModel"})
    @ViewModelType({
      "type": HeroDetailViewModel,
    "modelName": "HeroViewModel1"})
    public details: HeroDetail[];

    @ViewModelType({"type": HeroDetailViewModel})
    public detailsVM: HeroDetail[];

    public simpleArray: number[];

}