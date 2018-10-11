/*Codegen*/
// tslint:disable

import { HeroDetailViewModel } from './heroDetailViewModel';
import { States } from '../../../../src/tasks/model/stateModel';

export interface HeroViewModel1 {

  name: string;

  data: string;

  details: HeroDetailViewModel [];

  detailsVM: HeroDetailViewModel [];

  simpleArray: number [];

  state: States;
}
