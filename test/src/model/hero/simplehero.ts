import {GenerateView, IgnoreViewModel, ViewModelName, ViewModelType} from "../../../../src/index";

@GenerateView("HeroViewModel")
export class HeroViewModel {
  @ViewModelName("login")
  public name: string;

  public age: string;

  @IgnoreViewModel()
  public nation: string;

  public proffesion: string;

  public level: number;

  public siblings: string[];

}
