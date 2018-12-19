/*Codegen*/
// tslint:disable

import { HeroDetailViewModel } from '../heroDetailViewModel';
import { HeroDetail } from '../../../../src/model/hero/heroDetail';

export class HeroDetailViewModelMapper {
      public static toHeroDetailViewModel(model: HeroDetail, context?: any): HeroDetailViewModel {
            let result : HeroDetailViewModel = {};
            result.detail = model.data;
            return result;
      }
      public static fromHeroDetailViewModel(viewModel: HeroDetailViewModel, context?: any): HeroDetail {
            let result = new HeroDetail();
            result.data = viewModel.detail;
            return result;
      }
}
