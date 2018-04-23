import { HeroDetailViewModel } from '../heroDetailViewModel';
import { HeroDetail } from '../../../../src/model/hero/heroDetail';

export class HeroDetailViewModelMapper {
      public static toHeroDetailViewModel(model: HeroDetail): HeroDetailViewModel {
            let result = new HeroDetailViewModel();
            result.detail = model.data;
            return result;
      }
      public static fromHeroDetailViewModel(viewModel: HeroDetailViewModel): HeroDetail {
            let result = new HeroDetail();
            result.data = viewModel.detail;
            return result;
      }
}