import { HeroDetailViewModel } from '../heroDetailViewModel';

export class HeroDetailViewModelMapper {
      public static async toHeroDetailViewModel(model: any /*HeroDetail*/): Promise<HeroDetailViewModel> {
            let result = new HeroDetailViewModel();
            result.detail = model.data;
            return result;
      }
}
