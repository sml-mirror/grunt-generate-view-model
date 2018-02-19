import { HeroDetailViewModel } from './HeroDetailViewModel';

export class HeroDetailViewModelMapper {
    public  static toHeroDetailViewModel(model: any /*HeroDetail*/): HeroDetailViewModel {
      let result = new HeroDetailViewModel();
            result.detail = model.data;
            return result;
    }
  }




