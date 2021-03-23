/*Codegen*/
// tslint:disable
/* eslint-disable */

import { HeroViewModel } from '../heroViewModel';
import { Hero } from '../../../../src/model/hero/hero';
import { HeroDetailViewModelMapper } from './heroDetailViewModelMapper';

export class HeroViewModelMapper {
      public static toHeroViewModel(model: Hero): HeroViewModel {
            let result = new HeroViewModel();
                  result.id = model.id.toString();
            result.name = model.name;
            result.information = model.data;
            if (model.detail) {
                  result.detail = JSON.parse(JSON.stringify(model.detail));
            }
            if (model.detailVM) {
                  result.detailVM =  HeroDetailViewModelMapper.toHeroDetailViewModel(model.detailVM);
            }
            if (model.details) {
                  let tmp =  model.details.map( function(item: any ) {return  HeroDetailViewModelMapper.toHeroDetailViewModel(item); });
                  tmp.forEach( mp => {
                       let p =  mp;
                       result.details.push(p); });
            }
            if (model.detailsVM) {
                  let tmp =  model.detailsVM.map( function(item: any ) {return  HeroDetailViewModelMapper.toHeroDetailViewModel(item); });
                  tmp.forEach( mp => {
                       let p =  mp;
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
            result.id = viewModel.id ? +viewModel.id : viewModel.id as any;
            result.name = viewModel.name;
            result.data = viewModel.information;
            if (viewModel.detail) {
                  result.detail = JSON.parse(JSON.stringify(viewModel.detail));
            }
            if (viewModel.detailVM) {
                  result.detailVM =  HeroDetailViewModelMapper.fromHeroDetailViewModel(viewModel.detailVM);
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
