/*Codegen*/
// tslint:disable
/* eslint-disable */

import { HeroDetail } from '../../../src/model/hero/heroDetail';
import { HeroDetailViewModel } from './heroDetailViewModel';
import { States } from '../../../../src/tasks/model/stateModel';

export interface HeroViewModel1 {

  name?: string;

  data?: string;

  detail?: HeroDetail;

  details?: HeroDetailViewModel [];

  detailsVM?: HeroDetailViewModel [];

  simpleArray?: number [];

  state?: States;

}
