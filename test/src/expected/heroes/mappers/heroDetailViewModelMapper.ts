import { HeroDetailViewModel } from '../heroDetailViewModel';
import { HeroDetail } from '../../../../src/model/hero/heroDetail';

export class HeroDetailViewModelMapper {
      public static async toHeroDetailViewModel(model: HeroDetail): Promise<HeroDetailViewModel> {
            let result = new HeroDetailViewModel();
            result.detail = model.data;
            return result;
      }

      public static async fromHeroDetailViewModel(viewModel: HeroDetailViewModel): Promise<HeroDetail> {
            let result = new HeroDetail();
            result.data = viewModel.detail;
            return result;
      }
}
