import { HeroDetail } from '../../../../src/model/hero/heroDetail';
import { Func } from 'Path';
import { HeroDetailViewModel } from '../heroDetailViewModel';

import { HeroViewModel } from '../heroViewModel';

export class HeroViewModelMapper {
      public static async toHeroViewModel(model: any /*Hero*/): Promise<HeroViewModel> {
            let result = new HeroViewModel();
            result.id = model.id.toString();
            result.name = model.name;
            result.information = model.data;
            result.detail  = await  Func(model);
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
}
