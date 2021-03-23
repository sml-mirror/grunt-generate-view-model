/*Codegen*/
// tslint:disable
/* eslint-disable */

import { Length,ValidateIf,MaxLength,Max } from 'class-validator';
import { NotExistiningDecoratorForClass } from 'node-modules-library';
import { HeroDetail } from '../../../src/model/hero/heroDetail';

@NotExistiningDecoratorForClass()
export class ContextHeroModel {

      @Max(1000,)
      @Length(0,20,)
      @ValidateIf(o => o.otherProperty === 'value',)
      @ValidateIf(o => o.toty !== "value",)
      public name?: string;

      public detailForView: HeroDetail;

}
