/*Codegen*/
// tslint:disable

import { ContextHeroModel } from '../contextHeroModel';
import { Hero } from '../../../../src/model/hero/contextHero';
import { Class } from '../../../../src/model/Path/path';

export class ContextHeroModelMapper {
      public static async toContextHeroModel(model: Hero, context?: any): Promise<ContextHeroModel> {
            let result : ContextHeroModel = {};
            result.name = model.name;
            result.detail  = await (Class as any)(model, context);
            return result;
      }
      public static fromContextHeroModel(viewModel: ContextHeroModel, context?: any): Hero {
            let result = new Hero();
            result.name = viewModel.name;
            result.detail  =  (Class as any)(viewModel, context);
            return result;
      }
}
