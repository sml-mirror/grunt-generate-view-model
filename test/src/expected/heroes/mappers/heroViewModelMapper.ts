import { HeroViewModel } from '../heroViewModel';
import { Hero } from '../../../../src/model/hero/hero';
import { Class } from '../../../../src/model/Path/path';
import { HeroDetailViewModelMapper } from './heroDetailViewModelMapper';

export class HeroViewModelMapper {
      public static async toHeroViewModel(model: Hero): Promise<HeroViewModel> {
            let result = new HeroViewModel();
            result.id = model.id.toString();
            result.name = model.name;
            result.information = model.data;
            result.detail  = await Class(model);
            if (model.detailVM) {
                  result.detailVM =  await HeroDetailViewModelMapper.toHeroDetailViewModel(model.detailVM);
            }
            if (model.details) {
                  let tmp =  await model.details.map(async function(item: any ) {return await HeroDetailViewModelMapper.toHeroDetailViewModel(item); });
                  tmp.forEach(async mp => {
                       let p = await mp;
                       result.details.push(p); });
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
      public static fromHeroViewModel(viewModel: HeroViewModel): Hero {
            let result = new Hero();
            result.id = parseInt(viewModel.id, 10);
            result.name = viewModel.name;
            result.data = viewModel.information;
            result.detail  =  Class(viewModel);
            if (viewModel.detailVM) {
                  result.detailVM =   HeroDetailViewModelMapper.fromHeroDetailViewModel(viewModel.detailVM);
            }
            if (viewModel.details) {
                  let tmp =  viewModel.details.map( function(item: any ) {return  HeroDetailViewModelMapper.fromHeroDetailViewModel(item); });
                  tmp.forEach( mp => {
                       let p =  mp;
                       result.details.push(p); });
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
