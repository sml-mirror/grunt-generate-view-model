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

    @ViewModelName("information")
    public data: string;

    @IgnoreViewModel()
    public detailId?: number;

    @ViewModelType("HeroDetail", "../../models/newHeroes/heroDetail")
    public detail: HeroDetail;

    @ViewModelType("HeroDetailViewModel", "")
    public detailVM: HeroDetail;

    @ViewModelType("HeroDetail", "../../models/newHeroes/heroDetail")
    public details: HeroDetail[];

    @ViewModelType("HeroDetailViewModel", "")
    public detailsVM: HeroDetail[];

    public simpleArray: number[];

}