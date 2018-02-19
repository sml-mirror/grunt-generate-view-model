import { HeroDetail } from '../../test/src/model/hero/heroDetail';
import { HeroDetailViewModel } from './heroDetailViewModel';
import { HeroDetailViewModelMapper } from './heroDetailViewModelMapper';
import { HeroViewModel } from './HeroViewModel';

export class HeroViewModelMapper {
    public  static toHeroViewModel(model: any /*Hero*/, details: any): HeroViewModel {
      let result = new HeroViewModel();
            result.id = model.id.toString();
                  result.name = model.name;
                  result.information = model.data;
                        result.detail = JSON.parse(JSON.stringify(model.detail));
                        if ( model.detailVM ) {
                        result.detailVM = HeroDetailViewModelMapper.toHeroDetailViewModel(model.detailVM);
                        }
                  if ( model.details ) {
            result.details = details.map( function(item: any) {
                                    return HeroDetailViewModelMapper.toHeroDetailViewModel(item);
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




