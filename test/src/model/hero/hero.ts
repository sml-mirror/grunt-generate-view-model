import {GenerateView, IgnoreViewModel, ViewModelName, ViewModelType, NeedMapper} from "../../../../src/index";
import {HeroDetail} from "./heroDetail";



@GenerateView("HeroViewModel")
@GenerateView("HeroViewModel1")
@NeedMapper()
export class Hero {

    @ViewModelType("string", "")
    @IgnoreViewModel("HeroViewModel1")
    public id?: number;


    public name: string;

    @ViewModelName("information", "HeroViewModel")
    public data: string;

    @IgnoreViewModel()
    public detailId?: number;

    @ViewModelType("HeroDetail", "../../test/src/model/hero/heroDetail", "HeroViewModel")
    @IgnoreViewModel("HeroViewModel1")
    public detail: HeroDetail;

    @ViewModelType("HeroDetailViewModel", "./heroDetailViewModel")
    @IgnoreViewModel("HeroViewModel1")
    public detailVM: HeroDetail;

    @ViewModelType("HeroDetail", "../../test/src/model/hero/heroDetail", "HeroViewModel", {"func" : "GenerateView", "funcPath": "../../../../src/index"})
    @ViewModelType("HeroDetailViewModel", "./heroDetailViewModel", "HeroViewModel1")
    public details: HeroDetail[];

    @ViewModelType("HeroDetailViewModel", "./heroDetailViewModel")
    public detailsVM: HeroDetail[];

    public simpleArray: number[];

}