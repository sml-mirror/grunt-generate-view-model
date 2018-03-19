import { HeroViewModel } from '../heroViewModel';
import { Hero } from '../../../../src/model/hero/hero';
import { Class } from '../../../../src/model/Path/path';

export class HeroViewModelMapper {
      public static async toHeroViewModel(model: Hero): Promise<HeroViewModel> {
            let result = new HeroViewModel();
            result.id = model.id.toString();
            result.name = model.name;
            result.information = model.data;
            result.detail  = await Class(model);
            if (model.detailVM) {
                  result.detailVM = JSON.parse(JSON.stringify(model.detailVM));
            }
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

      public static async fromHeroViewModel(viewModel: HeroViewModel): Promise<Hero> {
            let result = new Hero();
            result.id = parseInt(viewModel.id,10);
            result.name = viewModel.name;
            result.data = viewModel.information;
            result.detail  = await Class(viewModel);
            if (viewModel.detailVM) {
                  result.detailVM = JSON.parse(JSON.stringify(viewModel.detailVM));
            }
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
