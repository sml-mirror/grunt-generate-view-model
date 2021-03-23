/*Codegen*/
// tslint:disable
/* eslint-disable */

import { HeroDetailViewModel } from './heroDetailViewModel';
import { HeroDetail } from '../../../src/model/hero/heroDetail';
import { States } from '../../../../src/tasks/model/stateModel';

@NotExistiningDecoratorForClas2()
export class HeroViewModel1 {

      public name?: string;

      public data?: string;

      public detail?: HeroDetail;

      public details?: HeroDetailViewModel[];

      public detailsVM?: HeroDetailViewModel[];

      public simpleArray?: number[];

      public state?: States;

}
