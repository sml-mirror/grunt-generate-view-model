/*This file was automatically generated */
// tslint:disable
// @ts-nocheck
/* eslint-disable */

import { HeroDetailViewModel } from '../heroDetailViewModel';
import { HeroDetail } from '../../../../src/model/hero/heroDetail';

export class HeroDetailViewModelMapper {
      public static toHeroDetailViewModel(model: HeroDetail): HeroDetailViewModel {
            let result:any = {};
            result.detail = model.data;
            if (model.temp) {
                  result.temp = JSON.parse(JSON.stringify(model.temp));
            }
            return result;
      }
      public static fromHeroDetailViewModel(viewModel: HeroDetailViewModel): HeroDetail {
            let result = new HeroDetail();
            result.data = viewModel.detail;
            if (viewModel.temp) {
                  result.temp = JSON.parse(JSON.stringify(viewModel.temp));
            }
            return result;
      }
}
