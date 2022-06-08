/*This file was automatically generated */
// tslint:disable
// @ts-nocheck
/* eslint-disable */

import { NotExistiningDecoratorForClass,ValidatorWithoutBraces } from 'node-modules-library';
import { HeroDetail } from '../../../src/model/hero/heroDetail';
import { States } from '../../../../src/tasks/model/stateModel';
import { HeroDetailViewModel } from '../../../src/expected/heroes/heroDetailViewModel';

@NotExistiningDecoratorForClass() 
@ValidatorWithoutBraces 
export class HeroViewModel {

      @ValidatorWithoutBraces
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
