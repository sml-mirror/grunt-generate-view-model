/*Codegen*/
// tslint:disable
/* eslint-disable */

import { NotExistiningDecoratorForClass } from 'node-modules-library';
import { HeroDetailViewModel } from './heroDetailViewModel';
import { HeroDetail } from '../../../src/model/hero/heroDetail';
import { States } from '../../../../src/tasks/model/stateModel';

@NotExistiningDecoratorForClass()
export class HeroViewModel {

      public id?: string;

      public name?: string;

      public information?: string;

      public detail?: HeroDetail;

      public detailVM?: HeroDetailViewModel;

      public details?: HeroDetailViewModel[];

      public detailsVM?: HeroDetailViewModel[];

      public simpleArray?: number[];

      public state?: States;

}
