/*Codegen*/
// tslint:disable

import { SimpeHeroViewModel } from '../simpeHeroViewModel';
import { SimpleHero } from '../../../../src/model/hero/simplehero';

export class SimpeHeroViewModelMapper {
      public static toSimpeHeroViewModel(model: SimpleHero): SimpeHeroViewModel {
            let result : SimpeHeroViewModel = {};
            result.login = model.name;
            result.age = model.age;
            result.proffesion = model.proffesion;
            result.level = model.level ? +model.level : model.level
            if (model.siblings) {
                  result.siblings =  model.siblings.map(function(item: any ) { return JSON.parse(JSON.stringify(item)); });
            }
            return result;
      }
      public static fromSimpeHeroViewModel(viewModel: SimpeHeroViewModel): SimpleHero {
            let result = new SimpleHero();
            result.name = viewModel.login;
            result.age = viewModel.age;
            result.proffesion = viewModel.proffesion;
            result.level = viewModel.level;
            if (viewModel.siblings) {
                  result.siblings =  viewModel.siblings.map(function(item: any ) { return JSON.parse(JSON.stringify( item )); });
            }
            return result;
      }
}
