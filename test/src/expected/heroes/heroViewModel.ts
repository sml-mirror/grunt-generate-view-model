/*Codegen*/
import { HeroDetail } from '../../../src/model/hero/heroDetail';
import { HeroDetailViewModel } from './heroDetailViewModel';

  export class HeroViewModel {

  public id?: string;

  public name: string;

  public information: string;

  public detail: HeroDetail;

  public detailVM: HeroDetailViewModel;

  public details: HeroDetailViewModel [];

  public detailsVM: HeroDetailViewModel [];

  public simpleArray: number [];
}
