import { HeroViewModel1 } from '../heroViewModel1';
import { Hero } from '../../../../src/model/hero/hero';

export class HeroViewModel1Mapper {
      public static async toHeroViewModel1(model: Hero): Promise<HeroViewModel1> {
            let result = new HeroViewModel1();
            result.name = model.name;
            result.data = model.data;
            if (model.details) {
                  result.details =  model.details.map(function(item: any ) { return JSON.parse(JSON.stringify(model.details)); });
            }
            if (model.detailsVM) {
                  result.detailsVM =  model.detailsVM.map(function(item: any ) { return JSON.parse(JSON.stringify(model.detailsVM)); });
            }
            if (model.simpleArray) {
                  result.simpleArray =  model.simpleArray.map(function(item: any ) { return JSON.parse(JSON.stringify(model.simpleArray)); });
            }
            return result;
      }

      public static async fromHeroViewModel1(viewModel: HeroViewModel1): Promise<Hero> {
            let result = new Hero();
            result.name = viewModel.name;
            result.data = viewModel.data;
            if (viewModel.details) {
                  result.details =  viewModel.details.map(function(item: any ) { return JSON.parse(JSON.stringify(viewModel.details)); });
            }
            if (viewModel.detailsVM) {
                  result.detailsVM =  viewModel.detailsVM.map(function(item: any ) { return JSON.parse(JSON.stringify(viewModel.detailsVM)); });
            }
            if (viewModel.simpleArray) {
                  result.simpleArray =  viewModel.simpleArray.map(function(item: any ) { return JSON.parse(JSON.stringify(viewModel.simpleArray)); });
            }
            return result;
      }
}
