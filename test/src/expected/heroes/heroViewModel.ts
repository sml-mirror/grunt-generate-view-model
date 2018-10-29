/*Codegen*/
// tslint:disable

import { HeroDetail } from '../../../src/model/hero/heroDetail';
import { HeroDetailViewModel } from './heroDetailViewModel';
import { States } from '../../../../src/tasks/model/stateModel';

export interface HeroViewModel {
  id?: string;

  name?: string;

  information?: string;

  detail?: HeroDetail;

  detailVM?: HeroDetailViewModel;

  details?: HeroDetailViewModel [];

  detailsVM?: HeroDetailViewModel [];

  simpleArray?: number [];

  state?: States;

}
