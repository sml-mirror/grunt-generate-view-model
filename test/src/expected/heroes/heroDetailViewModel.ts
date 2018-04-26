/*Codegen*/

export class HeroDetailViewModel {

  public detail: string;
  constructor(model?: HeroDetailViewModel) {
  if (model) {
    if (model.detail !== undefined) {
        this.detail = model.detail;
    }
    }
  }
}
