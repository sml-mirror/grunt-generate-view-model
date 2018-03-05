import { HeroViewModel1 } from '../heroViewModel1';
import { Class } from '../../../../src/model/Path/path';

export class HeroViewModel1Mapper {
      public static async toHeroViewModel1(model: any /*Hero*/): Promise<HeroViewModel1> {
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
}
