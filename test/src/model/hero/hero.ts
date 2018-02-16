import {GenerateView, IgnoreViewModel, ViewModelName, ViewModelType, NeedMapper} from "../../../../src/index";
import {HeroDetail} from "./heroDetail";



@GenerateView("HeroViewModel")
@GenerateView("HeroViewModel1")
@NeedMapper()
export class Hero {

    @ViewModelType({"type": "string", "filepath": ""})
    @IgnoreViewModel("HeroViewModel1")
    public id?: number;


    public name: string;

    @ViewModelName("information", "HeroViewModel")
    public data: string;

    @IgnoreViewModel()
    public detailId?: number;

    @ViewModelType({"type": "HeroDetail", "filepath": "../../test/src/model/hero/heroDetail", "modelName": "HeroViewModel"})
    @IgnoreViewModel("HeroViewModel1")
    public detail: HeroDetail;

    @ViewModelType({"type": "HeroDetailViewModel", "filepath": "./heroDetailViewModel", "isView": true})
    @IgnoreViewModel("HeroViewModel1")
    public detailVM: HeroDetail;

    @ViewModelType({"type": "HeroDetail", "filepath": "../../test/src/model/hero/heroDetail",
    "modelName": "HeroViewModel", "transformer": {"func" : "GenerateView", "funcPath": "../../../../src/index"}, "isView": true})
    @ViewModelType({"type": "HeroDetailViewModel", "filepath": "./heroDetailViewModel", "modelName": "HeroViewModel1"})
    public details: HeroDetail[];

    @ViewModelType({"type": "HeroDetailViewModel",  "filepath": "./heroDetailViewModel"})
    public detailsVM: HeroDetail[];

    public simpleArray: number[];

}