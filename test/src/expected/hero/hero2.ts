/*Codegen*/
  export class HeroDetailViewModel {

  public detail: string;
  constructor(model?: any) {
    if (model) {

    this.detail = model.data;
}
}
}
export class HeroViewModel1 {

  public name: string;

  public data: string;

  public details: HeroDetailViewModel [];

  public detailsVM: HeroDetailViewModel [];

  public simpleArray: number [];
  constructor(model?: any) {
    if (model) {

    this.name = model.name;

    this.data = model.data;
    if ( model.details ) {
      this.details = model.details.map(function(item: any) {
        if ( item ) {
            return new HeroDetailViewModel ( item );
          }
          return null;
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