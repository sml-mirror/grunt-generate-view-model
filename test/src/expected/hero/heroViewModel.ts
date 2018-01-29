/*Codegen*/
import { HeroDetail} from '../../models/newHeroes/heroDetail';
  export class HeroDetailViewModel {

  public detail: string;
  constructor(model?: any) {
    if (model) {

    this.detail = model.data;
}
}
}
export class HeroViewModel {

  public name: string;

  public information: string;

  public detail: HeroDetail;

  public detailVM: HeroDetailViewModel;

  public details: HeroDetail [];

  public detailsVM: HeroDetailViewModel [];

  public simpleArray: number [];
  constructor(model?: any) {
    if (model) {

    this.name = model.name;

    this.information = model.data;

    this.detail = JSON.parse(JSON.stringify(model.detail));
  if ( model.detailVM ) {
    this.detailVM = new HeroDetailViewModel ( model.detailVM ); ////generate 
  }
    if ( model.details ) {
      this.details = model.details.map(function(item: any) {
        return JSON.parse(JSON.stringify(item));
      });
    }
    if ( model.detailsVM ) {
      this.detailsVM = model.detailsVM.map(function(item: any) {
        if ( item ) {
            return new HeroDetailViewModel ( item );
          }
          return null;
      });
    }
    if ( model.simpleArray ) {
      this.simpleArray = model.simpleArray.map(function(item: any) {
        return JSON.parse(JSON.stringify(item));
      });
    }
}
}
}
export class HeroViewModel1 {

  public name: string;

  public data: string;

  public detailsVM: HeroDetailViewModel [];

  public simpleArray: number [];
  constructor(model?: any) {
    if (model) {

    this.name = model.name;

    this.data = model.data;
    if ( model.detailsVM ) {
      this.detailsVM = model.detailsVM.map(function(item: any) {
        if ( item ) {
            return new HeroDetailViewModel ( item );
          }
          return null;
      });
    }
    if ( model.simpleArray ) {
      this.simpleArray = model.simpleArray.map(function(item: any) {
        return JSON.parse(JSON.stringify(item));
      });
    }
}
}
}
