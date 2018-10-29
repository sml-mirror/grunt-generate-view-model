/*Codegen*/
// tslint:disable

import { HeroViewModel1 } from '../heroViewModel1';
import { Hero } from '../../../../src/model/hero/hero';
import { HeroDetailViewModelMapper } from './heroDetailViewModelMapper';

export class HeroViewModel1Mapper {
      public static async toHeroViewModel1(model: Hero): Promise<HeroViewModel1> {
            let result : HeroViewModel1 = {};
            result.name = model.name;
            result.data = model.data;
            if (model.details) {
                  result.details =  model.details.map(function(item: any ) { return JSON.parse(JSON.stringify(item)); });
            }
            if (model.detailsVM) {
                  let tmp =  await model.detailsVM.map(async function(item: any ) {return await HeroDetailViewModelMapper.toHeroDetailViewModel(item); });
                  tmp.forEach(async mp => {
                       let p = await mp;
                       result.detailsVM.push(p); });
            }
            if (model.simpleArray) {
                  result.simpleArray =  model.simpleArray.map(function(item: any ) { return JSON.parse(JSON.stringify(item)); });
            }
            result.state = model.state;
            return result;
      }
      public static fromHeroViewModel1(viewModel: HeroViewModel1): Hero {
            let result = new Hero();
            result.name = viewModel.name;
            result.data = viewModel.data;
            if (viewModel.details) {
                  result.details =  viewModel.details.map(function(item: any ) { return JSON.parse(JSON.stringify( item )); });
            }
            if (viewModel.detailsVM) {
                  let tmp =  viewModel.detailsVM.map( function(item: any ) {return  HeroDetailViewModelMapper.fromHeroDetailViewModel(item); });
                  tmp.forEach( mp => {
                       let p =  mp;
                       result.detailsVM.push(p); });
            }
            if (viewModel.simpleArray) {
                  result.simpleArray =  viewModel.simpleArray.map(function(item: any ) { return JSON.parse(JSON.stringify( item )); });
            }
            result.state = viewModel.state;
            return result;
      }
}
