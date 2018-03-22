import { HeroViewModel1 } from '../heroViewModel1';
import { Hero } from '../../../../src/model/hero/hero';
import { HeroDetailViewModelMapper } from './HeroDetailViewModelMapper';

export class HeroViewModel1Mapper {
      public static async toHeroViewModel1(model: Hero): Promise<HeroViewModel1> {
            let result = new HeroViewModel1();
            result.name = model.name;
            result.data = model.data;
            if (model.details) {
                  let tmp = await model.details.map(async function(item: any ) {return await HeroDetailViewModelMapper.toHeroDetailViewModel(item) });
                  tmp.forEach(async mp => { 
                       let p =await mp;
                       result.details.push(p)});                  
            }
            if (model.detailsVM) {
                  let tmp = await model.detailsVM.map(async function(item: any ) {return await HeroDetailViewModelMapper.toHeroDetailViewModel(item) });
                  tmp.forEach(async mp => { 
                       let p =await mp;
                       result.detailsVM.push(p)});                  
            }
            if (model.simpleArray) {
                  result.simpleArray =  model.simpleArray.map(function(item: any ) { return JSON.parse(JSON.stringify(item)); });
            }
            return result;
      }
      public static async fromHeroViewModel1(viewModel: HeroViewModel1): Promise<Hero> {
            let result = new Hero();
            result.name = viewModel.name;
            result.data = viewModel.data;
            if (viewModel.details) {
                  let tmp = await viewModel.details.map(async function(item: any ) {return await HeroDetailViewModelMapper.fromHeroDetailViewModel(item) });
                  tmp.forEach(async mp => { 
                       let p =await mp;
                       result.details.push(p)});                  
            }
            if (viewModel.detailsVM) {
                  let tmp = await viewModel.detailsVM.map(async function(item: any ) {return await HeroDetailViewModelMapper.fromHeroDetailViewModel(item) });
                  tmp.forEach(async mp => { 
                       let p =await mp;
                       result.detailsVM.push(p)});                  
            }
            if (viewModel.simpleArray) {
                  result.simpleArray =  viewModel.simpleArray.map(function(item: any ) { return JSON.parse(JSON.stringify( item )); });
            }
            return result;
      }
}
