import { HeroDetailViewModel } from './heroDetailViewModel';
import { HeroDetailViewModelMapper } from './heroDetailViewModelMapper';
import { HeroViewModel1 } from './HeroViewModel1';

export class HeroViewModel1Mapper {
    public  static toHeroViewModel1(model: any /*Hero*/): HeroViewModel1 {
      let result = new HeroViewModel1();
            result.name = model.name;
                  result.data = model.data;
                  if ( model.details ) {
            result.details = model.details.map(function(item: any) {
                                    if ( item ) {
                  return HeroDetailViewModelMapper.toHeroDetailViewModel( item );
                  }
            return null;
                                    });
            }
            if ( model.detailsVM ) {
            result.detailsVM = model.detailsVM.map(function(item: any) {
                                    if ( item ) {
                  return HeroDetailViewModelMapper.toHeroDetailViewModel( item );
                  }
            return null;
                                    });
            }
            if ( model.simpleArray ) {
            result.simpleArray = model.simpleArray.map(function(item: any) {
                        return JSON.parse(JSON.stringify(item));
                        });
            }
      return result;
    }
  }




