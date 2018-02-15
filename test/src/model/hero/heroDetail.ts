import {GenerateView, IgnoreViewModel, ViewModelName, ViewModelType, NeedMapper} from "../../../../src/index";

@GenerateView("HeroDetailViewModel")
@NeedMapper()
export class HeroDetail {

    @IgnoreViewModel()
    public id?: number;

    @ViewModelName("detail")
    public data: string;
}