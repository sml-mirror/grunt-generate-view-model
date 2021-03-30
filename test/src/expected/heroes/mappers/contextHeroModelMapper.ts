/*This file was automatically generated */
// tslint:disable
/* eslint-disable */

import { ContextHeroModel } from '../contextHeroModel';
import { Hero } from '../../../model/hero/contextHero';
import { asyncTransformer } from '../../../../../transformer/asyncTransformer';
import { ComplexInterface } from '../../../../../transformer/complexContextParam';

export class ContextHeroModelMapper {
      public static async toContextHeroModel(model: Hero, context?: ComplexInterface): Promise<ContextHeroModel> {
            let result = new ContextHeroModel();
            result.name = model.name;
           result.detailForView = await asyncTransformer(model, context);
            return result;
      }
      public static fromContextHeroModel(viewModel: ContextHeroModel): Hero {
            let result = new Hero();
            result.name = viewModel.name;
            result.detail = null;
                  return result;
      }
}
