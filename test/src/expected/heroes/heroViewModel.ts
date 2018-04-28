/*Codegen*/
import { HeroDetail } from '../../../src/model/hero/heroDetail';
import { HeroDetailViewModel } from './heroDetailViewModel';
import { States } from '../../../../src/tasks/model/stateModel';

export class HeroViewModel {

  public id?: string;

  public name: string;

  public information: string;

  public detail: HeroDetail;

  public detailVM: HeroDetailViewModel;

  public details: HeroDetailViewModel [];

  public detailsVM: HeroDetailViewModel [];

  public simpleArray: number [];

  public state: States;
  constructor(model?: HeroViewModel) {
  if (model) {
    if (model.id !== undefined) {
        this.id = model.id;
    }
    if (model.name !== undefined) {
        this.name = model.name;
    }
    if (model.information !== undefined) {
        this.information = model.information;
    }
    if ( model.detail !== undefined) {
      if (model.detail === null) {
        this.detail = null;
      } else {
        this.detail = JSON.parse(JSON.stringify(model.detail));
      }
    }
    if ( model.detailVM !== undefined) {
      if (model.detailVM === null) {
        this.detailVM = null;
      } else {
        this.detailVM = JSON.parse(JSON.stringify(model.detailVM));
      }
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
    if (model.state !== undefined) {
      if ( model.state === null) {
        this.state = null;
      } else {
        this.state = +model.state;
      }
    }
    }
  }
}
