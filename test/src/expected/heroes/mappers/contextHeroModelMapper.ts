/*Codegen*/
// tslint:disable
/* eslint-disable */

import { ContextHeroModel } from '../contextHeroModel';
import { Hero } from '../../../../src/model/hero/contextHero';

export class ContextHeroModelMapper {
      public static toContextHeroModel(model: Hero): ContextHeroModel {
            let result = new ContextHeroModel();
                  result.name = model.name;
            if (model.detail) {
                  result.detailForView = JSON.parse(JSON.stringify(model.detail));
            }
            return result;
      }
      public static fromContextHeroModel(viewModel: ContextHeroModel): Hero {
            let result = new Hero();
            result.name = viewModel.name;
            if (viewModel.detailForView) {
                  result.detail = JSON.parse(JSON.stringify(viewModel.detailForView));
            }
            return result;
      }
}
