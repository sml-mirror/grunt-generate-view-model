/*Codegen*/
import { HeroDetailViewModel } from './heroDetailViewModel';

export class HeroViewModel1 {

  public name: string;

  public data: string;

  public details: HeroDetailViewModel [];

  public detailsVM: HeroDetailViewModel [];

  public simpleArray: number [];
  constructor(model?: HeroViewModel1) {
  if (model) {
    if (model.name !== undefined) {
        this.name = model.name;
    }
    if (model.data !== undefined) {
        this.data = model.data;
    }
    if ( model.details !== undefined) {
      if (model.details === null) {
        this.details = null;
      } else {
        this.details = JSON.parse(JSON.stringify(model.details));
      }
    }
    if ( model.detailsVM !== undefined) {
      if (model.detailsVM === null) {
        this.detailsVM = null;
      } else {
        this.detailsVM = JSON.parse(JSON.stringify(model.detailsVM));
      }
    }
    if ( model.simpleArray !== undefined) {
      if (model.simpleArray === null) {
        this.simpleArray = null;
      } else {
        this.simpleArray = JSON.parse(JSON.stringify(model.simpleArray));
      }
    }
    }
  }
}
