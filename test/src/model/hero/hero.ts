import {GenerateView, IgnoreViewModel, ViewModelName, ViewModelType} from "../../../../src/index";

@GenerateView("HeroDetailViewModel")
export class HeroDetail {

    @IgnoreViewModel()
    public id?: number;

    @ViewModelName("detail")
    public data: string;
}

@GenerateView("HeroViewModel")
@GenerateView("HeroViewModel1")
export class Hero {

    @IgnoreViewModel()
    public id?: number;

    public name: string;

    @ViewModelName("information", "HeroViewModel")
    public data: string;

    @IgnoreViewModel()
    public detailId?: number;

    @ViewModelType("HeroDetail", "../../models/newHeroes/heroDetail", "HeroViewModel")
    @IgnoreViewModel("HeroViewModel1")
    public detail: HeroDetail;

    @ViewModelType("HeroDetailViewModel", "")
    @IgnoreViewModel("HeroViewModel1")
    public detailVM: HeroDetail;

    @ViewModelType("HeroDetail", "../../models/newHeroes/heroDetail", "HeroViewModel")
    @ViewModelType("HeroDetailViewModel", "", "HeroViewModel1")
    //@IgnoreViewModel("HeroViewModel1")
    public details: HeroDetail[];

    @ViewModelType("HeroDetailViewModel", "")
    public detailsVM: HeroDetail[];

    public simpleArray: number[];

}